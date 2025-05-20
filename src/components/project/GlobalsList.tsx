'use client';

import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { routes } from '@/utils/routes';
import { H3 } from '@/components/typography';
import { useApp } from '@/providers/app';

type FlattenedGlobal = {
  key: string;
  value: string | number | boolean | null;
};

const flattenObject = (obj: any, parentKey = '', result: FlattenedGlobal[] = []) => {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result.push({ key: newKey, value: obj[key] === null ? 'null' : String(obj[key]) });
      }
    }
  }
  return result;
};

export type GlobalsListProps = {
  globalContext: any;
};

export const GlobalsList = (props: GlobalsListProps) => {
  const { globalContext } = props;
  const { selectedProjectUuid } = useApp(); // Get projectUuid from context

  if (!selectedProjectUuid) {
    // Handle case where projectUuid is not available, though this shouldn't happen if it's used on a project page context
    return <p className="text-sm text-destructive-foreground">Error: Project context not found.</p>;
  }

  if (!globalContext || Object.keys(globalContext).length === 0) {
    return (
      <div>
        <p className="text-sm text-muted-foreground mt-2">No global context variables defined.</p>
        <Link
          className="text-sm text-primary mt-2 block hover:underline"
          href={routes.studio.projectGlobals(selectedProjectUuid)}
        >
          Edit Globals
        </Link>
      </div>
    );
  }

  const flattenedGlobals = flattenObject(globalContext);

  return (
    <div>
      <div className="mt-2 space-y-3">
        {flattenedGlobals.map((item) => (
          <div key={item.key}>
            <Label className="text-xs text-muted-foreground">{item.key}</Label>
            <div className="text-sm p-2 border rounded bg-background break-all">{item.value}</div>
          </div>
        ))}
      </div>
      <Link
        className="text-sm text-primary mt-3 block hover:underline"
        href={routes.studio.projectGlobals(selectedProjectUuid)}
      >
        Edit Globals
      </Link>
    </div>
  );
};
