import DevPreviewBadge from "./DevPreviewBadge";
import TechPreviewBadge from "./TechPreviewBadge";

export enum ModelBadge {
  DEV = "dev",
  TECH = "tech",
}

export enum BadgeType {
  DEV = "Dev Preview",
  TECH = "Tech Preview",
}

export const getBadgeFromType = (badge: ModelBadge | BadgeType) => {
  switch (badge) {
    case ModelBadge.DEV:
    case BadgeType.DEV:
      return <DevPreviewBadge />;
    case ModelBadge.TECH:
    case BadgeType.TECH:
      return <TechPreviewBadge />;
    default:
      return null;
  }
};
