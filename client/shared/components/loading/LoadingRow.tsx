import { TableCell, TableRow, Skeleton } from "@mui/material";

interface LoadingRowProps {
  cellCount: number;
}

export default function LoadingRow({ cellCount }: LoadingRowProps) {
  return (
    <TableRow>
      {Array.from({ length: cellCount }).map((_, index) => (
        <TableCell key={index} className="py-2!">
          <Skeleton variant="rounded" width="90%" height={25} />
        </TableCell>
      ))}
    </TableRow>
  );
}
