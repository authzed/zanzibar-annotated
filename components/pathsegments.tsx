export type PathSegments = {
  basePath?: string;
  pathPrefix?: string;
  selectionId?: string;
};

/**
 * Parses a pathname into parts used to highlight selections.
 * basePath: The base path for the siet. Only supports a single level base path.
 * pathPrefix: The prefix that identifies that type of selection. Must start with '_'
 * selectionId: The content selection id
 */
export function getPathSegments(pathname: string): PathSegments {
  // Only handle deeplink paths (identified by the presence of ':')
  // to allow default behavior for all other fragments such as anchor links
  let basePath, pathPrefix, selectionId;
  const pathParts = pathname.split('/').filter((part) => part);
  const partCount = pathParts.length;
  let part = pathParts.pop();
  switch (partCount) {
    case 0:
      // No parts present
      break;
    case 1:
      // /<selection id>
      // /<base path>
      if (part?.includes(':')) {
        selectionId = part;
      } else {
        basePath = part;
      }
      break;
    case 2:
      // /<base path>/<selection id>
      // /<path prefix>/<selection id>
      if (part?.includes(':')) {
        selectionId = part;
        const baseOrPrefix = pathParts.pop();
        // path prefixes must start with an underscore
        if (baseOrPrefix?.startsWith('_')) {
          pathPrefix = baseOrPrefix;
        } else {
          basePath = baseOrPrefix;
        }
      } else {
        // <unknown format>
        // Preserve base path, ignore remainder of path
        basePath = pathParts.pop();
      }
      break;
    case 3:
      // /<base path>/<path prefix>/<selection id>
      if (part?.includes(':')) {
        selectionId = part;
        pathPrefix = pathParts.pop();
        basePath = pathParts.pop();
      }
      // <unknown format>
      break;
    default:
      console.log('Unsupported path format');
      break;
  }

  return {
    basePath,
    pathPrefix,
    selectionId,
  };
}
