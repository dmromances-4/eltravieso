import IntegrationsPanel from "@/components/account/IntegrationsPanel";

function integrationsDemoMode() {
  return (
    !process.env.SHOPIFY_CLIENT_ID?.trim() &&
    !process.env.HOLDED_API_KEY?.trim() &&
    process.env.SQUARE_ENVIRONMENT !== "production"
  );
}

export default function IntegracionesPage() {
  return <IntegrationsPanel demoMode={integrationsDemoMode()} />;
}
