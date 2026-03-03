import { useEffect, useState } from "react";
import { Label, Spinner, Title } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useApiBase, fetchJson } from "./api";

interface ServicePort {
  port: number;
  targetPort: number;
  protocol: string;
}

interface Service {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  type: string;
  cluster_ip: string;
  ports: ServicePort[];
}

interface Ingress {
  id: string;
  cluster_id: string;
  namespace_id: string;
  name: string;
  host: string;
  path: string;
  service_name: string;
  tls: number;
}

interface NetworkingPageProps {
  clusterIds: string[];
}

const formatPorts = (ports: ServicePort[]): string =>
  ports.map((p) => `${p.port}:${p.targetPort}/${p.protocol}`).join(", ");

const stripClusterPrefix = (namespaceId: string, clusterId: string): string =>
  namespaceId.replace(`${clusterId}-`, "");

const NetworkingPage = ({ clusterIds }: NetworkingPageProps) => {
  const apiBase = useApiBase();
  const [services, setServices] = useState<Service[]>([]);
  const [ingresses, setIngresses] = useState<Ingress[]>([]);
  const [loading, setLoading] = useState(true);
  const multiCluster = clusterIds.length > 1;

  useEffect(() => {
    Promise.all([
      Promise.all(
        clusterIds.map((id) =>
          fetchJson<Service[]>(`${apiBase}/clusters/${id}/services`),
        ),
      ),
      Promise.all(
        clusterIds.map((id) =>
          fetchJson<Ingress[]>(`${apiBase}/clusters/${id}/ingresses`),
        ),
      ),
    ]).then(([svcResults, ingResults]) => {
      setServices(svcResults.flat());
      setIngresses(ingResults.flat());
      setLoading(false);
    });
  }, [apiBase, clusterIds]);

  if (loading) return <Spinner size="lg" />;

  return (
    <>
      <Title headingLevel="h2">Services</Title>
      <Table aria-label="Services" variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            {multiCluster && <Th>Cluster</Th>}
            <Th>Namespace</Th>
            <Th>Type</Th>
            <Th>Cluster IP</Th>
            <Th>Ports</Th>
          </Tr>
        </Thead>
        <Tbody>
          {services.map((svc) => (
            <Tr key={svc.id}>
              <Td>{svc.name}</Td>
              {multiCluster && <Td>{svc.cluster_id}</Td>}
              <Td>{stripClusterPrefix(svc.namespace_id, svc.cluster_id)}</Td>
              <Td>
                <Label>{svc.type}</Label>
              </Td>
              <Td>{svc.cluster_ip}</Td>
              <Td>{formatPorts(svc.ports)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Title headingLevel="h2">Ingresses</Title>
      <Table aria-label="Ingresses" variant="compact">
        <Thead>
          <Tr>
            <Th>Name</Th>
            {multiCluster && <Th>Cluster</Th>}
            <Th>Host</Th>
            <Th>Path</Th>
            <Th>Service</Th>
            <Th>TLS</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ingresses.map((ing) => (
            <Tr key={ing.id}>
              <Td>{ing.name}</Td>
              {multiCluster && <Td>{ing.cluster_id}</Td>}
              <Td>{ing.host}</Td>
              <Td>{ing.path}</Td>
              <Td>{ing.service_name}</Td>
              <Td>
                <Label color={ing.tls === 1 ? "green" : "grey"}>
                  {ing.tls === 1 ? "Yes" : "No"}
                </Label>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export default NetworkingPage;
