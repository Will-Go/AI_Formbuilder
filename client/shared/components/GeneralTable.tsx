"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableCell,
  TableRow,
  TablePagination,
  Tooltip,
} from "@mui/material";
import { cn } from "@/shared/utils/cn";
import LoadingRow from "./loading/LoadingRow";
import { useTranslations } from "next-intl";

//ICONS
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export interface HeaderOrder {
  label: string;
  name: string;
}

export type Header = string | React.ReactNode | HeaderOrder;

interface TableProps {
  children: React.ReactNode;
  headers: Header[];
  headerAlign?: "left" | "center" | "right";
  isLoading?: boolean;
  toolHeader?: React.ReactNode;
  isPagination?: boolean;
  page?: number;
  setPage?: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage?: number;
  totalPages?: number;
  setRowsPerPage?: React.Dispatch<React.SetStateAction<number>>;
  orderBy?: string;
  order?: "asc" | "desc";
  onOrderChange?: (orderBy: string, order: "asc" | "desc") => void;
  isNoData?: boolean;
  noDataMessage?: string;
  numLoadingRows?: number;
  className?: string;
  caption?: string;
  rowsPerPageOptions?: number[];
}

export default function GeneralTable({
  children,
  headers,
  isLoading,
  toolHeader,
  isPagination,
  page,
  setPage,
  totalPages,
  rowsPerPage = 5,
  setRowsPerPage,
  isNoData,
  noDataMessage,
  numLoadingRows = 5,
  className,
  caption,
  order = "asc",
  orderBy,
  onOrderChange,
  rowsPerPageOptions = [5, 10, 25],
  headerAlign = "left",
}: Readonly<TableProps>) {
  const t = useTranslations("common.table");
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const stickyScrollbarRef = useRef<HTMLDivElement | null>(null);
  const isSyncingScrollRef = useRef<"table" | "sticky" | null>(null);

  const [showStickyScrollbar, setShowStickyScrollbar] = useState(false);
  const [stickyScrollbarGeometry, setStickyScrollbarGeometry] = useState({
    left: 0,
    width: 0,
    scrollWidth: 0,
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    if (setPage) setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (setRowsPerPage) {
      setRowsPerPage(parseInt(event.target.value, 10));
    }
  };

  const recalc = React.useCallback(() => {
    const element = tableContainerRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const isPartiallyVisible = rect.bottom > 0 && rect.top < viewportHeight;
    const isBottomVisible = rect.bottom <= viewportHeight && rect.bottom >= 0;
    const hasHorizontalOverflow = element.scrollWidth > element.clientWidth + 1;

    setStickyScrollbarGeometry({
      left: rect.left,
      width: rect.width,
      scrollWidth: element.scrollWidth,
    });

    setShowStickyScrollbar(
      Boolean(isPartiallyVisible && !isBottomVisible && hasHorizontalOverflow),
    );
  }, []);

  React.useEffect(() => {
    recalc();
  }, [recalc, isLoading, isNoData, headers]);

  React.useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    // Use capture: true to catch scroll events from any parent container (e.g., Drawers, Dialogs)
    window.addEventListener("scroll", recalc, { passive: true, capture: true });
    window.addEventListener("resize", recalc);

    const resizeObserver = new ResizeObserver(recalc);
    resizeObserver.observe(el);

    // Also observe the internal table to detect size changes driven by content (like column width changes)
    const tableEl = el.querySelector("table");
    if (tableEl) {
      resizeObserver.observe(tableEl);
    }

    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
      resizeObserver.disconnect();
    };
  }, [recalc]);

  React.useEffect(() => {
    const tableEl = tableContainerRef.current;
    const stickyEl = stickyScrollbarRef.current;
    if (!tableEl || !stickyEl) return;

    const onTableScroll = () => {
      if (isSyncingScrollRef.current === "sticky") return;
      isSyncingScrollRef.current = "table";
      stickyEl.scrollLeft = tableEl.scrollLeft;
      isSyncingScrollRef.current = null;
    };

    const onStickyScroll = () => {
      if (isSyncingScrollRef.current === "table") return;
      isSyncingScrollRef.current = "sticky";
      tableEl.scrollLeft = stickyEl.scrollLeft;
      isSyncingScrollRef.current = null;
    };

    tableEl.addEventListener("scroll", onTableScroll, { passive: true });
    stickyEl.addEventListener("scroll", onStickyScroll, { passive: true });

    stickyEl.scrollLeft = tableEl.scrollLeft;

    return () => {
      tableEl.removeEventListener("scroll", onTableScroll);
      stickyEl.removeEventListener("scroll", onStickyScroll);
    };
  }, [showStickyScrollbar]);

  return (
    <div
      className={cn(
        "h-full w-full overflow-clip bg-white p-0! shadow-lg!",
        className,
      )}
    >
      {toolHeader && <div className="z-10 p-4">{toolHeader}</div>}
      <TableContainer
        className="!h-full !overflow-y-hidden"
        ref={tableContainerRef}
      >
        <Table>
          <TableHead>
            <TableRow className="!z-20 !bg-neutral-100">
              {headers.map((header, index) => {
                if (
                  header &&
                  typeof header === "object" &&
                  "label" in header &&
                  "name" in header
                ) {
                  const { label, name } = header;
                  const isSorted = orderBy === name;
                  return (
                    <TableCell
                      onClick={() => {
                        if (onOrderChange) {
                          if (orderBy === name) {
                            onOrderChange(
                              name,
                              order === "asc" ? "desc" : "asc",
                            );
                          } else {
                            onOrderChange(name, "asc");
                          }
                        }
                      }}
                      key={index}
                      align={headerAlign}
                      className="group !text-neutral cursor-pointer font-semibold text-nowrap"
                    >
                      <Tooltip
                        placement="top"
                        key={index}
                        title={
                          order === "asc"
                            ? t("orderAsc", { label })
                            : t("orderDesc", { label })
                        }
                      >
                        <span className="!z-20">{label}</span>
                      </Tooltip>

                      <ArrowDownwardIcon
                        className={cn(
                          "!text-neutral !ml-2 opacity-0 !transition-all duration-300 ease-in-out group-hover:opacity-100",
                          isSorted && "opacity-100",
                          isSorted && order === "asc" && "!rotate-180",
                        )}
                        fontSize="small"
                      />
                    </TableCell>
                  );
                }

                return (
                  <TableCell
                    align={headerAlign}
                    key={index}
                    className="!text-neutral font-semibold text-nowrap"
                  >
                    <span className="!z-20">{header}</span>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody className="!z-20">
            {isLoading ? (
              Array.from({ length: numLoadingRows }).map((_, index) => (
                <LoadingRow key={index} cellCount={headers.length} />
              ))
            ) : (
              <>
                {isNoData && (
                  <TableRow>
                    <TableCell
                      colSpan={headers.length}
                      className="!text-secondary italic"
                      align="center"
                    >
                      {noDataMessage || t("noData")}
                    </TableCell>
                  </TableRow>
                )}
                {children}
              </>
            )}
          </TableBody>
          {caption && <caption className="p-6"></caption>}
        </Table>
      </TableContainer>
      {isPagination && page && totalPages ? (
        <TablePagination
          component="div"
          colSpan={99}
          className="flex !w-full justify-end"
          rowsPerPageOptions={rowsPerPageOptions}
          count={rowsPerPage * totalPages}
          rowsPerPage={rowsPerPage}
          page={page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t("rowsPerPage")}
          labelDisplayedRows={({ from, to, count }) =>
            t("displayedRows", { from, to, count })
          }
        />
      ) : null}

      {showStickyScrollbar ? (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: stickyScrollbarGeometry.left,
            width: stickyScrollbarGeometry.width,
            height: 16,
            overflowX: "auto",
            overflowY: "hidden",
            zIndex: 1300,
            background: "white",
          }}
          ref={stickyScrollbarRef}
        >
          <div
            style={{ width: stickyScrollbarGeometry.scrollWidth, height: 1 }}
          />
        </div>
      ) : null}
    </div>
  );
}
