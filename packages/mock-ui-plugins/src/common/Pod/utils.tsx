/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ReactElement, useEffect, useMemo, useState } from "react";
import {
  AccessReviewResourceAttributes,
  AllPodStatus,
  DEPLOYMENT_PHASE,
  DEPLOYMENT_STRATEGY,
  ExtPodKind,
  HorizontalPodAutoscalerKind,
  HorizontalPodAutoscalerModel,
  ImpersonateKind,
  k8sCreate,
  K8sKind,
  K8sResourceCommon,
  K8sResourceKind,
  K8sVerb,
  PodRCData,
  ProjectModel,
  SDKStoreState,
  SelfSubjectAccessReviewKind,
  SelfSubjectAccessReviewModel,
} from "../utils";
import { useClusterScope } from "../ClusterScopeContext";
import { transformPod, transformDeployment } from "../transformers";
import * as _ from "lodash";

/** Map k8s kind to mock server endpoint path. */
const kindToEndpoint: Record<string, string> = {
  Pod: "pods",
  Deployment: "deployments",
  Node: "nodes",
  Namespace: "namespaces",
  Service: "services",
  Event: "events",
  Ingress: "ingresses",
};

/** Map k8s kind to its transformer function. Kinds without a transformer return raw rows. */
const transformByKind: Record<string, (row: never) => unknown> = {
  Pod: transformPod as (row: never) => unknown,
  Deployment: transformDeployment as (row: never) => unknown,
};

/** Fetches resources from the mock server, transforming them into k8s shapes
 *  where a transformer exists. For kinds without a mock server endpoint
 *  (HPA, ReplicaSet, etc.), returns empty with loaded=true. */
export function useK8sWatchResource<T>(resource: {
  kind?: string;
  groupVersionKind?: { group?: string; version?: string; kind?: string };
  namespace?: string;
  namespaced?: boolean;
  optional?: boolean;
  isList?: boolean;
}): [T, boolean, string] {
  const { clusterId, apiBase } = useClusterScope();
  const [data, setData] = useState<T>([] as unknown as T);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const kind = resource.kind ?? resource.groupVersionKind?.kind ?? "";
  const namespace = resource.namespace;
  const endpoint = kindToEndpoint[kind];

  useEffect(() => {
    // Kinds without a mock endpoint return graceful empty
    if (!endpoint || !clusterId) {
      setData([] as unknown as T);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const url = namespace
      ? `${apiBase}/clusters/${clusterId}/${endpoint}?namespace=${namespace}`
      : `${apiBase}/clusters/${clusterId}/${endpoint}`;

    const doFetch = () => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json();
        })
        .then((rows: never[]) => {
          if (cancelled) return;
          const transform = transformByKind[kind];
          const result = transform ? rows.map(transform) : rows;
          setData(result as unknown as T);
          setLoaded(true);
          setError("");
        })
        .catch((err) => {
          if (cancelled) return;
          setError(String(err));
          setLoaded(true);
        });
    };

    doFetch();
    const interval = setInterval(doFetch, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiBase, clusterId, endpoint, kind, namespace]);

  return [data, loaded, error];
}

/** Watches pods for a given k8s resource (e.g. a Deployment).
 *  Returns PodRCData suitable for PodRingSet. */
export function usePodsWatcher(obj: K8sResourceKind): {
  podData: PodRCData;
  loaded: boolean;
  loadError: string;
} {
  const { clusterId, apiBase } = useClusterScope();
  const [pods, setPods] = useState<ExtPodKind[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const namespace = obj?.metadata?.namespace;

  useEffect(() => {
    if (!clusterId) {
      setPods([]);
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const url = namespace
      ? `${apiBase}/clusters/${clusterId}/pods?namespace=${namespace}`
      : `${apiBase}/clusters/${clusterId}/pods`;

    const doFetch = () => {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          return res.json();
        })
        .then((rows: never[]) => {
          if (cancelled) return;
          setPods(rows.map(transformPod as (row: never) => ExtPodKind));
          setLoaded(true);
          setLoadError("");
        })
        .catch((err) => {
          if (cancelled) return;
          setLoadError(String(err));
          setLoaded(true);
        });
    };

    doFetch();
    const interval = setInterval(doFetch, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiBase, clusterId, namespace]);

  const podData = useMemo<PodRCData>(() => {
    const desired = obj?.spec?.replicas ?? 0;
    const available = obj?.status?.availableReplicas ?? desired;
    const isRollingOut = available < desired;

    return {
      current: {
        alerts: {},
        revision: 0,
        obj: obj,
        phase: isRollingOut ? "Running" : "Complete",
        pods,
      },
      previous: {
        alerts: {},
        revision: 0,
        obj: obj,
        phase: isRollingOut ? "Running" : "Complete",
        pods: [],
      },
      obj,
      isRollingOut,
      pods,
    };
  }, [obj, pods]);

  return { podData, loaded, loadError };
}

const checkAccessInternal = _.memoize(
  (
    group: string,
    resource: string,
    subresource: string,
    verb: K8sVerb,
    name: string,
    namespace: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    impersonateKey: string,
  ): Promise<SelfSubjectAccessReviewKind> => {
    // Projects are a special case. `namespace` must be set to the project name
    // even though it's a cluster-scoped resource.
    const reviewNamespace =
      group === ProjectModel.apiGroup && resource === ProjectModel.plural
        ? name
        : namespace;
    const ssar: SelfSubjectAccessReviewKind = {
      apiVersion: "authorization.k8s.io/v1",
      kind: "SelfSubjectAccessReview",
      spec: {
        resourceAttributes: {
          group,
          resource,
          subresource,
          verb,
          name,
          namespace: reviewNamespace,
        },
      },
    };
    return k8sCreate(SelfSubjectAccessReviewModel, ssar);
  },
  (...args) => args.join("~"),
);

type GetImpersonate = (state: SDKStoreState) => ImpersonateKind | undefined;

export const getImpersonate: GetImpersonate = (state) =>
  state.sdkCore.impersonate;

const getImpersonateKey = (impersonate?: ImpersonateKind): string => {
  // The storehandle here references to the redux store. We want to what this, we can have this async if needed, we do not want redux or something similar.
  // this experiment should be as simple as possible
  // storeHandler was an OCP Redux reference — stubbed out for mock env
  const newImpersonate = impersonate;
  return newImpersonate ? `${newImpersonate.kind}~${newImpersonate.name}` : "";
};

export const checkAccess = (
  resourceAttributes: AccessReviewResourceAttributes,
  impersonate?: ImpersonateKind,
): Promise<SelfSubjectAccessReviewKind> => {
  // Destructure the attributes with defaults so we can create a stable cache key.
  const {
    group = "",
    resource = "",
    subresource = "",
    verb = "" as K8sVerb,
    name = "",
    namespace = "",
  } = resourceAttributes || {};
  return checkAccessInternal(
    group,
    resource,
    subresource,
    verb,
    name,
    namespace,
    getImpersonateKey(impersonate),
  );
};

export const checkPodEditAccess = (
  resource: K8sResourceKind,
  resourceKind: K8sKind,
  impersonate: ImpersonateKind,
  subresource?: string,
): Promise<SelfSubjectAccessReviewKind | null> => {
  if (_.isEmpty(resource) || !resourceKind) {
    return Promise.resolve(null);
  }
  // @ts-ignore
  const { name, namespace } = resource.metadata;
  const resourceAttributes: AccessReviewResourceAttributes = {
    group: resourceKind.apiGroup,
    resource: resourceKind.plural,
    subresource,
    verb: "patch",
    name,
    namespace,
  };
  return checkAccess(resourceAttributes, impersonate);
};

export const usePodScalingAccessStatus = (
  obj: K8sResourceKind,
  resourceKind: K8sKind,
  pods: ExtPodKind[],
  enableScaling?: boolean,
  impersonate?: ImpersonateKind,
) => {
  const isKnativeRevision = obj.kind === "Revision";
  const isPod = obj.kind === "Pod";
  const isScalingAllowed = !isKnativeRevision && !isPod && enableScaling;
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (isScalingAllowed) {
      checkPodEditAccess(obj, resourceKind, impersonate!, "scale")
        .then((resp: SelfSubjectAccessReviewKind | null) =>
          setEditable(_.get(resp, "status.allowed", false)),
        )
        .catch((error) => {
          // console.log is used here instead of throw error
          // throw error will break the thread and likely end-up in a white screen
          // eslint-disable-next-line
          console.log('Checking pod edit acceess failed:', error);
          setEditable(false);
        });
    }
  }, [pods, obj, resourceKind, impersonate, setEditable, isScalingAllowed]);

  return editable;
};

export const doesHpaMatch =
  (workload: K8sResourceCommon) => (thisHPA: HorizontalPodAutoscalerKind) => {
    const {
      apiVersion,
      kind,
      // @ts-ignore
      metadata: { name },
    } = workload;
    const ref = thisHPA?.spec?.scaleTargetRef;
    return (
      ref &&
      ref.apiVersion === apiVersion &&
      ref.kind === kind &&
      ref.name === name
    );
  };

export const useRelatedHPA = (
  workloadAPI: string,
  workloadKind: string,
  workloadName: string,
  workloadNamespace: string,
): [HorizontalPodAutoscalerKind | undefined, boolean, string] => {
  // The use watch k8s resource can be some hook that does api polling to the mock server
  const [hpas, loaded, error] = useK8sWatchResource<
    HorizontalPodAutoscalerKind[]
  >({
    kind: HorizontalPodAutoscalerModel.kind,
    namespace: workloadNamespace,
    optional: true,
    isList: true,
  });

  const matchingHpa = useMemo<HorizontalPodAutoscalerKind | undefined>(() => {
    if (hpas && loaded && !error) {
      return hpas.find(
        doesHpaMatch({
          apiVersion: workloadAPI,
          kind: workloadKind,
          metadata: { name: workloadName },
        }),
      );
    }
    return undefined; // similar to .find(() => false)
  }, [hpas, loaded, error, workloadAPI, workloadKind, workloadName]);

  return [matchingHpa, loaded, error];
};

type PodRingLabelType = {
  subTitle: string;
  title: string;
  titleComponent: ReactElement;
};

type PodRingLabelData = {
  title: string;
  longTitle: boolean;
  subTitle: string;
  longSubtitle: boolean;
  reversed: boolean;
};

export const hpaPodRingLabel = (
  obj: K8sResourceKind,
  hpa?: HorizontalPodAutoscalerKind,
  pods?: ExtPodKind[],
): PodRingLabelData => {
  const desiredPodCount = obj.spec?.replicas;
  const desiredPods = hpa?.status?.desiredReplicas || desiredPodCount;
  const currentPods = hpa?.status?.currentReplicas;
  const scaling =
    (!currentPods && !!desiredPods) ||
    !pods?.every((p) => p.status?.phase === "Running");
  return {
    title: scaling ? "Autoscaling" : "Autoscaled",
    subTitle: `${desiredPods} Pods}`,
    longTitle: false,
    longSubtitle: false,
    reversed: true,
  };
};

export const usePodRingLabel = (
  obj: K8sResourceKind,
  pods: ExtPodKind[],
  hpaControlledScaling: boolean = false,
  hpa?: HorizontalPodAutoscalerKind,
): PodRingLabelType => {
  const podRingLabelData: PodRingLabelData = hpaControlledScaling
    ? hpaPodRingLabel(obj, hpa, pods)
    : {
        title: "Pod ring label",
        subTitle: "",
        longTitle: false,
        longSubtitle: false,
        reversed: false,
      };
  const { title, subTitle, longTitle, longSubtitle, reversed } =
    podRingLabelData;

  const res = useMemo(
    () => ({
      title,
      subTitle,
      titleComponent: <>{title}</>,
    }),
    [longSubtitle, longTitle, reversed, subTitle, title],
  );
  return res;
};

const getScalingUp = (dc: K8sResourceKind): ExtPodKind => {
  return {
    ..._.pick(dc, "metadata"),
    status: {
      phase: AllPodStatus.ScalingUp,
    },
  };
};

export const getPodData = (
  podRCData: PodRCData,
): {
  inProgressDeploymentData: ExtPodKind[] | null;
  completedDeploymentData: ExtPodKind[];
} => {
  const strategy: DEPLOYMENT_STRATEGY = _.get(
    podRCData.obj,
    ["spec", "strategy", "type"],
    null,
  );
  const currentDeploymentphase = podRCData.current && podRCData.current.phase;
  const currentPods = podRCData.current && podRCData.current.pods;
  const previousPods = podRCData.previous && podRCData.previous.pods;
  // DaemonSets and StatefulSets
  if (!strategy)
    return {
      inProgressDeploymentData: null,
      completedDeploymentData: podRCData.pods,
    };

  // Scaling no. of pods
  if (currentDeploymentphase === DEPLOYMENT_PHASE.complete) {
    return {
      inProgressDeploymentData: null,
      completedDeploymentData: currentPods,
    };
  }

  // Deploy - Rolling - Recreate
  if (
    (strategy === DEPLOYMENT_STRATEGY.recreate ||
      strategy === DEPLOYMENT_STRATEGY.rolling ||
      strategy === DEPLOYMENT_STRATEGY.rollingUpdate) &&
    podRCData.isRollingOut
  ) {
    return {
      inProgressDeploymentData: currentPods,
      completedDeploymentData: previousPods,
    };
  }
  // if build is not finished show `Scaling Up` on pod phase
  if (!podRCData.current && !podRCData.previous) {
    return {
      inProgressDeploymentData: null,
      completedDeploymentData: [getScalingUp(podRCData.obj!)],
    };
  }
  return {
    inProgressDeploymentData: null,
    completedDeploymentData: podRCData.pods,
  };
};
