import ProfileSettingsForm from "@/components/account/ProfileSettingsForm";

export default function AccountSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Configuración del perfil</h1>
        <p className="mt-2 text-slate-400">
          Foto, cumpleaños, email, dirección de envío y datos personales en un solo lugar.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8">
        <ProfileSettingsForm />
      </div>
    </div>
  );
}
