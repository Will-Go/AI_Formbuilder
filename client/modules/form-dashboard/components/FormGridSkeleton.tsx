"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

interface FormGridSkeletonProps {
  count?: number;
}

export default function FormGridSkeleton({ count = 8 }: FormGridSkeletonProps) {
  return (
    <Box sx={{ px: 0, pb: 6 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 2,
        }}
      >
        {Array.from({ length: count }).map((_, index) => (
          <Box
            key={index}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Skeleton variant="rectangular" sx={{ height: 92 }} />
            <Box sx={{ px: 2, py: 1.5 }}>
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton
                variant="text"
                width="50%"
                height={16}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
