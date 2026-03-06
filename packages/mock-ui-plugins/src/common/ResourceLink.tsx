/* eslint-disable @typescript-eslint/no-unused-vars */
export type ResourceLinkProps = {
  kind: string;
  name: string;
  namespace?: string;
};

export const ResourceLink: React.FC<ResourceLinkProps> = ({
  kind,
  name,
  namespace,
}) => {
  return <a href="#">{name} Fake link</a>;
};
