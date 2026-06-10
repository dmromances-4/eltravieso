'use client'

interface GeneratedCocktailImageProps {
  title: string
}

function colorFromTitle(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash % 360
}

export default function GeneratedCocktailImage({ title }: GeneratedCocktailImageProps) {
  const hue = colorFromTitle(title)
  const gradient = `linear-gradient(180deg, hsla(${hue}, 80%, 50%, 0.96), hsla(${(hue + 40) % 360}, 80%, 18%, 0.99))`

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 shadow-neon" style={{ background: gradient }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,209,66,0.2),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(43,135,185,0.16),transparent_35%)]" />
      <div className="absolute -right-16 top-8 h-36 w-36 rounded-full bg-electric-yellow/10 blur-3xl" />
      <div className="absolute left-10 top-24 h-24 w-24 rounded-full bg-electric-blue/10 blur-3xl" />
      <div className="relative flex min-h-[420px] flex-col justify-between p-10">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-slate-200">
            Imagen generada
          </span>
          <h2 className="text-4xl font-display font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          <p className="max-w-lg text-sm leading-7 text-slate-200/80">
            Esta imagen se genera automáticamente con un estilo único para cada receta, manteniendo un diseño uniforme y elegante.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-black/20 px-5 py-4 text-sm text-slate-300 backdrop-blur-sm">
          Diseño uniforme para todas las recetas.
        </div>
      </div>
    </div>
  )
}
