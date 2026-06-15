#!/usr/bin/env python3
"""Extract crimson line art from vermut poster and export as SVG."""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import vtracer


def build_red_mask(bgr: np.ndarray) -> np.ndarray:
    """Isolate crimson line art; exclude blue background and yellow typography."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    # Crimson / red strokes (wraps hue in OpenCV)
    red_low = cv2.inRange(hsv, np.array([0, 70, 60]), np.array([12, 255, 255]))
    red_high = cv2.inRange(hsv, np.array([168, 70, 60]), np.array([180, 255, 255]))
    red = cv2.bitwise_or(red_low, red_high)

    # Explicitly drop poster yellow headline/footer and blue field
    yellow = cv2.inRange(hsv, np.array([18, 80, 120]), np.array([38, 255, 255]))
    blue = cv2.inRange(hsv, np.array([95, 60, 60]), np.array([130, 255, 255]))

    mask = cv2.bitwise_and(red, cv2.bitwise_not(cv2.bitwise_or(yellow, blue)))

    # Light cleanup — preserve hand-drawn jitter
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

    return mask


def crop_to_illustration(mask: np.ndarray, padding: int = 24) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    """Crop to connected red artwork, excluding distant yellow headline/footer blobs."""
    h, w = mask.shape
    # Ignore top/bottom bands where large yellow type lives
    roi_top = int(h * 0.12)
    roi_bottom = int(h * 0.88)
    roi = mask[roi_top:roi_bottom, :]

    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(roi, connectivity=8)
    if num_labels <= 1:
        ys, xs = np.where(mask > 0)
        if len(xs) == 0:
            raise RuntimeError("No red pixels detected in source image.")
        x0, x1 = xs.min(), xs.max()
        y0, y1 = ys.min(), ys.max()
    else:
        # Keep substantial components (figure + bottles), drop tiny specks
        min_area = max(120, int(w * h * 0.00005))
        boxes = []
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area < min_area:
                continue
            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP] + roi_top
            bw = stats[i, cv2.CC_STAT_WIDTH]
            bh = stats[i, cv2.CC_STAT_HEIGHT]
            boxes.append((x, y, x + bw, y + bh))

        if not boxes:
            ys, xs = np.where(mask > 0)
            x0, x1 = xs.min(), xs.max()
            y0, y1 = ys.min(), ys.max()
        else:
            x0 = min(b[0] for b in boxes)
            y0 = min(b[1] for b in boxes)
            x1 = max(b[2] for b in boxes)
            y1 = max(b[3] for b in boxes)

    x0 = max(0, x0 - padding)
    y0 = max(0, y0 - padding)
    x1 = min(w, x1 + padding)
    y1 = min(h, y1 + padding)

    return mask[y0:y1, x0:x1], (x0, y0, x1, y1)


def _path_bbox_area(d: str) -> float:
    """Rough bbox area from path coordinates (drops spurious canvas-sized paths)."""
    nums = [float(n) for n in re.findall(r"-?\d+\.?\d*", d)]
    if len(nums) < 4:
        return 0.0
    xs = nums[0::2]
    ys = nums[1::2]
    return (max(xs) - min(xs)) * (max(ys) - min(ys))


def postprocess_svg(svg_raw: str, color: str, canvas_w: int, canvas_h: int) -> str:
    """Recolor paths crimson and drop accidental full-canvas background traces."""
    canvas_area = canvas_w * canvas_h
    kept_paths: list[str] = []

    for match in re.finditer(r"<path\b[^>]*/>", svg_raw, flags=re.I):
        tag = match.group(0)
        d_match = re.search(r'\bd="([^"]+)"', tag)
        if not d_match:
            kept_paths.append(tag)
            continue
        area = _path_bbox_area(d_match.group(1))
        if area > canvas_area * 0.85:
            continue
        tag = re.sub(r'fill="[^"]*"', f'fill="{color}"', tag)
        if 'fill="' not in tag:
            tag = tag.replace("<path ", f'<path fill="{color}" ', 1)
        kept_paths.append(tag)

    w_match = re.search(r'width="(\d+(?:\.\d+)?)"', svg_raw)
    h_match = re.search(r'height="(\d+(?:\.\d+)?)"', svg_raw)
    width = w_match.group(1) if w_match else str(canvas_w)
    height = h_match.group(1) if h_match else str(canvas_h)

    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" '
        f'width="{width}" height="{height}">\n'
        f'<g fill="{color}" fill-rule="evenodd">\n'
        + "\n".join(f"  {p}" for p in kept_paths)
        + "\n</g>\n</svg>\n"
    )


def mask_to_svg(mask: np.ndarray, output: Path, color: str = "#C8102E") -> None:
    """Trace binary mask to SVG with organic strokes."""
    pad = 32
    padded = cv2.copyMakeBorder(mask, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    # Black ink on white — standard input for binary tracing
    trace_bgr = np.full((*padded.shape, 3), 255, dtype=np.uint8)
    trace_bgr[padded > 0] = (0, 0, 0)

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        cv2.imwrite(str(tmp_path), trace_bgr)

        with tempfile.NamedTemporaryFile(suffix=".svg", delete=False) as svg_tmp:
            svg_tmp_path = Path(svg_tmp.name)

        vtracer.convert_image_to_svg_py(
            str(tmp_path),
            str(svg_tmp_path),
            colormode="binary",
            hierarchical="stacked",
            mode="spline",
            filter_speckle=2,
            color_precision=6,
            layer_difference=16,
            corner_threshold=100,
            length_threshold=2.5,
            max_iterations=8,
            splice_threshold=55,
            path_precision=2,
        )
        svg_raw = svg_tmp_path.read_text(encoding="utf-8")
        svg_tmp_path.unlink(missing_ok=True)
    finally:
        tmp_path.unlink(missing_ok=True)

    h, w = padded.shape
    svg_clean = postprocess_svg(svg_raw, color=color, canvas_w=w, canvas_h=h)
    output.write_text(svg_clean, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "input",
        type=Path,
        default=Path("assets/vermut-poster-source.png"),
        nargs="?",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("public/brand/travieso/vermut-chico-botellas-lineart.svg"),
    )
    parser.add_argument("--preview", type=Path, help="Optional PNG preview of extracted mask")
    parser.add_argument("--color", default="#C8102E", help="SVG fill color (crimson red)")
    args = parser.parse_args()

    if not args.input.exists():
        print(f"Input not found: {args.input}", file=sys.stderr)
        return 1

    bgr = cv2.imread(str(args.input))
    if bgr is None:
        print(f"Could not read image: {args.input}", file=sys.stderr)
        return 1

    mask = build_red_mask(bgr)
    cropped, _ = crop_to_illustration(mask)

    if args.preview:
        args.preview.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(args.preview), cropped)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    mask_to_svg(cropped, args.output, color=args.color)

    print(f"Wrote {args.output} ({cropped.shape[1]}×{cropped.shape[0]} px source crop)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
