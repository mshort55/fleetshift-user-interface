import { Card, CardBody, CardTitle } from "@patternfly/react-core";

interface CostStatCardProps {
  title: string;
  value: string;
}

const CostStatCard: React.FC<CostStatCardProps> = ({ title, value }) => {
  return (
    <Card isFullHeight>
      <CardTitle>{title}</CardTitle>
      <CardBody>
        <span
          style={{ fontSize: "var(--pf-t--global--font--size--heading--2xl)" }}
        >
          {value}
        </span>
      </CardBody>
    </Card>
  );
};

export default CostStatCard;
