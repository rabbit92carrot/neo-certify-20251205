'use client';

import { memo } from 'react';
import type { ComponentPropDoc } from '../types';

interface PropsTableProps {
  props: ComponentPropDoc[];
}

/**
 * Props 문서 테이블
 * 컴포넌트의 props를 테이블 형태로 표시
 */
function PropsTableComponent({ props }: PropsTableProps): React.ReactElement {
  if (props.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-500 text-center">
        No props documented
      </div>
    );
  }

  return (
    <div className="max-h-[180px] overflow-auto border-t border-gray-100">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-gray-600">
              Name
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-600">
              Type
            </th>
            <th className="text-center px-3 py-2 font-medium text-gray-600">
              Required
            </th>
            <th className="text-left px-3 py-2 font-medium text-gray-600">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {props.map((prop) => (
            <tr key={prop.name} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <code className="text-blue-600 font-mono">{prop.name}</code>
              </td>
              <td className="px-3 py-2">
                <code className="text-purple-600 font-mono text-[10px]">
                  {prop.type}
                </code>
              </td>
              <td className="px-3 py-2 text-center">
                {prop.required ? (
                  <span className="text-red-500 font-semibold">*</span>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600">
                {prop.description}
                {prop.defaultValue && (
                  <span className="ml-1 text-gray-400">
                    (default: <code>{prop.defaultValue}</code>)
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PropsTable = memo(PropsTableComponent);
