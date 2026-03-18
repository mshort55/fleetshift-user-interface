import {
  ClusterIcon,
  RocketIcon,
  EyeIcon,
  CogIcon,
} from "@patternfly/react-icons";

export const PERMISSIONS = [
  { icon: ClusterIcon, label: "Manage clusters and infrastructure" },
  { icon: RocketIcon, label: "Deploy and scale workloads" },
  { icon: EyeIcon, label: "View metrics, logs, and events" },
  { icon: CogIcon, label: "Modify configuration and secrets" },
];
