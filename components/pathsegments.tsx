export type PathSegments = {
  basePath?: string;
  selectionId?: string;
};

/**
 * Parses a pathname into parts used to highlight selections.
 * basePath: The base path for the site. Only supports a single level base path.
 * selectionId: The content selection id
 */
export function getPathSegments(pathname: string): PathSegments {
  // Only handle deeplink paths (identified by the presence of ':')
  // to allow default behavior for all other fragments such as anchor links
  let basePath, selectionId;
  const pathParts = pathname.split('/').filter((part) => part);
  const part = pathParts[pathParts.length - 1];
  switch (pathParts.length) {
    case 0:
      // No parts present
      break;
    case 1:
      // /<selection id>
      // /<base path>
      if (part.includes(':')) {
        selectionId = part;
      } else {
        basePath = part;
      }
      break;
    case 2:
      // /<base path>/<selection id>
      basePath = pathParts[0];
      if (part.includes(':')) {
        selectionId = part;
      }
      break;
    default:
      // <unknown format>
      // Preserve base path, ignore remainder of path
      basePath = pathParts[0];
      break;
  }

  return {
    basePath,
    selectionId,
  };
}
