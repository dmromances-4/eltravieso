import { NextResponse } from "next/server";
import { logServerError } from '@/lib/security/safe-error';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isHoldedConfigured } from "@/lib/integrations/holded-catalog";
import { ensureHoldedWebhookToken } from "@/lib/integrations/holded-webhook";
import { maskSecret, parseSecretUpdate } from "@/lib/security/redact";

function buildHoldedWebhookMeta(appUrl: string, token: string | null) {
  return {
    webhookUrl: `${appUrl}/api/integrations/holded/webhook`,
    barToken: maskSecret(token),
    hasBarToken: Boolean(token),
    webhookConfigured: Boolean(process.env.HOLDED_WEBHOOK_SECRET || token),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  let profile = await prisma.barProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      shopifyShopName: true,
      shopifyApiKey: true,
      shopifyAccessToken: true,
      shopifyLastSyncAt: true,
      shopifySyncStatus: true,
      shopifySyncError: true,
      holdedApiKey: true,
      holdedWebhookToken: true,
      holdedLastSyncAt: true,
      holdedSyncStatus: true,
      holdedSyncError: true,
      squareAccessToken: true,
      squareLocationId: true,
      squareLastSyncAt: true,
      squareSyncStatus: true,
      squareSyncError: true,
      tpvProvider: true,
      tpvWebhookUrl: true,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (profile && isHoldedConfigured(profile.holdedApiKey) && !profile.holdedWebhookToken) {
    profile = await prisma.barProfile.update({
      where: { userId: session.user.id },
      data: { holdedWebhookToken: ensureHoldedWebhookToken() },
      select: {
        shopifyShopName: true,
        shopifyApiKey: true,
        shopifyAccessToken: true,
        shopifyLastSyncAt: true,
        shopifySyncStatus: true,
        shopifySyncError: true,
        holdedApiKey: true,
        holdedWebhookToken: true,
        holdedLastSyncAt: true,
        holdedSyncStatus: true,
        holdedSyncError: true,
        squareAccessToken: true,
        squareLocationId: true,
        squareLastSyncAt: true,
        squareSyncStatus: true,
        squareSyncError: true,
        tpvProvider: true,
        tpvWebhookUrl: true,
      },
    });
  }

  const webhookUrl = profile?.tpvWebhookUrl ?? `${appUrl}/api/tpv/webhook`;
  const shopifyConnected = Boolean(
    profile?.shopifyShopName && (profile.shopifyAccessToken || profile.shopifyApiKey),
  );
  const holdedConnected = isHoldedConfigured(profile?.holdedApiKey);
  const squareConnected = Boolean(profile?.squareAccessToken);
  const holdedWebhook = buildHoldedWebhookMeta(appUrl, profile?.holdedWebhookToken ?? null);

  return NextResponse.json({
    shopify: {
      connected: shopifyConnected,
      shopName: profile?.shopifyShopName ?? null,
      hasApiKey: Boolean(profile?.shopifyApiKey || profile?.shopifyAccessToken),
      lastSyncAt: profile?.shopifyLastSyncAt?.toISOString() ?? null,
      syncStatus: profile?.shopifySyncStatus ?? "idle",
      syncError: profile?.shopifySyncError ?? null,
      oauthAvailable: Boolean(process.env.SHOPIFY_CLIENT_ID),
    },
    holded: {
      connected: holdedConnected,
      hasApiKey: Boolean(profile?.holdedApiKey || process.env.HOLDED_API_KEY),
      usesServerKey: Boolean(!profile?.holdedApiKey && process.env.HOLDED_API_KEY),
      lastSyncAt: profile?.holdedLastSyncAt?.toISOString() ?? null,
      syncStatus: profile?.holdedSyncStatus ?? "idle",
      syncError: profile?.holdedSyncError ?? null,
      ...holdedWebhook,
    },
    square: {
      connected: squareConnected,
      locationId: profile?.squareLocationId ?? null,
      lastSyncAt: profile?.squareLastSyncAt?.toISOString() ?? null,
      syncStatus: profile?.squareSyncStatus ?? "idle",
      syncError: profile?.squareSyncError ?? null,
    },
    tpvWebhookUrl: webhookUrl,
    tpvProvider: profile?.tpvProvider ?? null,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const shopifyShopName =
      body.shopifyShopName != null ? String(body.shopifyShopName).trim() || null : undefined;
    const shopifyApiKey =
      body.shopifyApiKey != null ? parseSecretUpdate(body.shopifyApiKey) : undefined;
    const holdedApiKey =
      body.holdedApiKey != null ? parseSecretUpdate(body.holdedApiKey) : undefined;
    const squareAccessToken =
      body.squareAccessToken != null ? parseSecretUpdate(body.squareAccessToken) : undefined;
    const regenerateHoldedWebhookToken = Boolean(body.regenerateHoldedWebhookToken);
    const squareLocationId =
      body.squareLocationId != null ? String(body.squareLocationId).trim() || null : undefined;

    const existing = await prisma.barProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Primero configura tu local en Mi local antes de conectar integraciones." },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const tpvWebhookUrl = `${appUrl}/api/tpv/webhook`;
    const willHaveHolded = isHoldedConfigured(
      holdedApiKey !== undefined ? holdedApiKey : existing.holdedApiKey,
    );

    const profile = await prisma.barProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(shopifyShopName !== undefined ? { shopifyShopName } : {}),
        ...(shopifyApiKey !== undefined ? { shopifyApiKey } : {}),
        ...(holdedApiKey !== undefined ? { holdedApiKey } : {}),
        ...(squareAccessToken !== undefined ? { squareAccessToken } : {}),
        ...(squareLocationId !== undefined ? { squareLocationId } : {}),
        ...(squareAccessToken !== undefined && squareAccessToken
          ? { tpvProvider: "square" }
          : {}),
        ...(regenerateHoldedWebhookToken
          ? { holdedWebhookToken: ensureHoldedWebhookToken() }
          : willHaveHolded && !existing.holdedWebhookToken
            ? { holdedWebhookToken: ensureHoldedWebhookToken() }
            : {}),
        tpvWebhookUrl,
      },
      select: {
        shopifyShopName: true,
        shopifyApiKey: true,
        shopifyAccessToken: true,
        shopifyLastSyncAt: true,
        shopifySyncStatus: true,
        shopifySyncError: true,
        holdedApiKey: true,
        holdedWebhookToken: true,
        holdedLastSyncAt: true,
        holdedSyncStatus: true,
        holdedSyncError: true,
        squareAccessToken: true,
        squareLocationId: true,
        squareLastSyncAt: true,
        squareSyncStatus: true,
        squareSyncError: true,
        tpvWebhookUrl: true,
      },
    });

    const shopifyConnected = Boolean(
      profile.shopifyShopName && (profile.shopifyAccessToken || profile.shopifyApiKey),
    );
    const holdedWebhook = buildHoldedWebhookMeta(appUrl, profile.holdedWebhookToken);
    const revealHoldedToken =
      regenerateHoldedWebhookToken && profile.holdedWebhookToken
        ? profile.holdedWebhookToken
        : null;

    return NextResponse.json({
      message: "Integraciones guardadas.",
      ...(revealHoldedToken ? { holdedWebhookTokenOnce: revealHoldedToken } : {}),
      shopify: {
        connected: shopifyConnected,
        shopName: profile.shopifyShopName,
        hasApiKey: Boolean(profile.shopifyApiKey || profile.shopifyAccessToken),
        lastSyncAt: profile.shopifyLastSyncAt?.toISOString() ?? null,
        syncStatus: profile.shopifySyncStatus ?? "idle",
        syncError: profile.shopifySyncError ?? null,
        oauthAvailable: Boolean(process.env.SHOPIFY_CLIENT_ID),
      },
      holded: {
        connected: isHoldedConfigured(profile.holdedApiKey),
        hasApiKey: Boolean(profile.holdedApiKey || process.env.HOLDED_API_KEY),
        usesServerKey: Boolean(!profile.holdedApiKey && process.env.HOLDED_API_KEY),
        lastSyncAt: profile.holdedLastSyncAt?.toISOString() ?? null,
        syncStatus: profile.holdedSyncStatus ?? "idle",
        syncError: profile.holdedSyncError ?? null,
        ...holdedWebhook,
      },
      square: {
        connected: Boolean(profile.squareAccessToken),
        locationId: profile.squareLocationId,
        lastSyncAt: profile.squareLastSyncAt?.toISOString() ?? null,
        syncStatus: profile.squareSyncStatus ?? "idle",
        syncError: profile.squareSyncError ?? null,
      },
      tpvWebhookUrl: profile.tpvWebhookUrl,
    });
  } catch (error) {
    logServerError('user-integrations', error);
    return NextResponse.json({ message: "Error al guardar la integración." }, { status: 500 });
  }
}
