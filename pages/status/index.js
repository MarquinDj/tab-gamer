import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <h1>Informações do banco</h1>
      <DatabaseInfo />
    </>
  );
}

function UpdatedAt() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString();
  }

  return (
    <div>
      <p>Útima Atualização: {updatedAtText}</p>
    </div>
  );
}

function DatabaseInfo() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 2000,
  });

  if (!isLoading && data) {
    return (
      <div>
        <p>Versão: {data.dependencies.version}</p>
        <p>Conexões Máximas: {data.dependencies.max_connections}</p>
        <p>Conexões: {data.dependencies.opened_connections}</p>
      </div>
    );
  } else {
    return (
      <div>
        <p>Carregando informações...</p>
      </div>
    );
  }
}
