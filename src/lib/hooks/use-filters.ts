"use client";

import {
  useQueryState,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { STATUSES, PRIORITIES } from "@/lib/constants";
import { useCallback, useMemo } from "react";

const sortOptions = ["created", "updated", "priority", "due_date", "title", "number"] as const;
const orderOptions = ["asc", "desc"] as const;

export function useFilters() {
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [priorityFilter, setPriorityFilter] = useQueryState(
    "priority",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [projectFilter, setProjectFilter] = useQueryState("project", parseAsString);
  const [labelFilter, setLabelFilter] = useQueryState(
    "label",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [search, setSearch] = useQueryState("q", parseAsString);
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringEnum(sortOptions as unknown as string[]).withDefault("created")
  );
  const [order, setOrder] = useQueryState(
    "order",
    parseAsStringEnum(orderOptions as unknown as string[]).withDefault("desc")
  );

  const hasFilters = useMemo(
    () =>
      statusFilter.length > 0 ||
      priorityFilter.length > 0 ||
      !!projectFilter ||
      labelFilter.length > 0 ||
      !!search,
    [statusFilter, priorityFilter, projectFilter, labelFilter, search]
  );

  const clearFilters = useCallback(() => {
    setStatusFilter([]);
    setPriorityFilter([]);
    setProjectFilter(null);
    setLabelFilter([]);
    setSearch(null);
  }, [setStatusFilter, setPriorityFilter, setProjectFilter, setLabelFilter, setSearch]);

  const toQueryParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (statusFilter.length > 0) {
      statusFilter.forEach((s) => {
        // Multiple values need to be appended
      });
    }
    if (sort) params.sort = sort;
    if (order) params.order = order;
    if (search) params.search = search;
    if (projectFilter) params.projectId = projectFilter;
    return params;
  }, [statusFilter, priorityFilter, projectFilter, labelFilter, search, sort, order]);

  const buildSearchParams = useCallback(() => {
    const sp = new URLSearchParams();
    statusFilter.forEach((s) => sp.append("status", s));
    priorityFilter.forEach((p) => sp.append("priority", p));
    labelFilter.forEach((l) => sp.append("label", l));
    if (projectFilter) sp.set("projectId", projectFilter);
    if (search) sp.set("search", search);
    if (sort) sp.set("sort", sort);
    if (order) sp.set("order", order);
    return sp;
  }, [statusFilter, priorityFilter, projectFilter, labelFilter, search, sort, order]);

  return {
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    projectFilter,
    setProjectFilter,
    labelFilter,
    setLabelFilter,
    search,
    setSearch,
    sort,
    setSort,
    order,
    setOrder,
    hasFilters,
    clearFilters,
    buildSearchParams,
  };
}
