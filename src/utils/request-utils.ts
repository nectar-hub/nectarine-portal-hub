
export const getPageTitleByPath = (path: string) => {
  if (path.includes('/buy-requests')) return "Buy For Me Requests";
  if (path.includes('/self-purchases')) return "Self Purchases";
  return "Purchase Requests";
};

export const getPageDescriptionByPath = (path: string) => {
  if (path.includes('/buy-requests')) return "Review and manage customer buy for me requests";
  if (path.includes('/self-purchases')) return "Review and manage self-purchase requests";
  return "Review and manage all customer purchase requests";
};

export const getRequestTypeByPath = (path: string) => {
  if (path.includes('/buy-requests')) return "buy_requests";
  if (path.includes('/self-purchases')) return "self_purchases";
  return undefined;
};
