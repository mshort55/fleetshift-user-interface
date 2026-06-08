import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Bullseye, Spinner } from "@patternfly/react-core";

const ClusterProviderSelectionPage = lazy(
  () => import("./cluster-providers/ClusterProviderSelectionPage"),
);
const ClusterProviderWizardPage = lazy(
  () => import("./cluster-providers/ClusterProviderWizardPage"),
);

const Loading = () => (
  <Bullseye>
    <Spinner size="xl" />
  </Bullseye>
);

export default function CreateClusterModule() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<ClusterProviderSelectionPage />} />
        <Route path=":providerId" element={<ClusterProviderWizardPage />} />
      </Routes>
    </Suspense>
  );
}
