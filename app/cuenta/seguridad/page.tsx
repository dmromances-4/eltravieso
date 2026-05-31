import PasswordSettingsForm from "@/components/account/PasswordSettingsForm";
import TwoFactorSettings from "@/components/account/TwoFactorSettings";

export default function AccountSecurityPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Seguridad</h1>
        <p className="mt-2 text-slate-400">Cambia tu contraseña y gestiona la autenticación en dos pasos.</p>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 space-y-6">
        <h2 className="text-lg font-bold text-white">Contraseña</h2>
        <PasswordSettingsForm />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#111111]/90 p-8 space-y-6">
        <h2 className="text-lg font-bold text-white">Verificación en dos pasos</h2>
        <TwoFactorSettings />
      </section>
    </div>
  );
}
