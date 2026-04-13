export default function Home() {
  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <iframe
        src="/admin_dashboard.html"
        title="Grand Meridian Admin Dashboard"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </main>
  );
}
