import * as React from "react";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 150 50"
      fill="currentColor"
      {...props}
    >
      <text
        fontFamily="Space Grotesk, sans-serif"
        fontSize="48"
        fontWeight="700"
        y="40"
        x="0"
      >
        SH
      </text>
    </svg>
  );
}
