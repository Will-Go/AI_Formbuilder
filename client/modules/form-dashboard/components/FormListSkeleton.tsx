"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

interface FormListSkeletonProps {
  count?: number;
}

export default function FormListSkeletonProps({
  count = 6,
}: FormListSkeletonProps) {
  return (
    <Box sx={{ px: { xs: 0, sm: 0 }, pb: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mb: 1.5, px: 2 }}
        >
          Today
        </Typography>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={`today-${index}`}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 0.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Skeleton variant="rectangular" width={20} height={20} sx={{ mr: 2 }} />
            <Box sx={{ flex: 3, minWidth: 0 }}>
              <Skeleton variant="text" width="40%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        ))}
      </Box>

      <Box>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, mb: 1.5, px: 2 }}
        >
          Earlier
        </Typography>
        {Array.from({ length: 3 }).map((_, index) => (
          <Box
            key={`earlier-${index}`}
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 0.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Skeleton variant="rectangular" width={20} height={20} sx={{ mr: 2 }} />
            <Box sx={{ flex: 3, minWidth: 0 }}>
              <Skeleton variant="text" width="40%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="50%" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" />
            </Box>
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}