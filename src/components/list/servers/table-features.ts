import {
  columnVisibilityFeature,
  rowSelectionFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const serverTableFeatures = tableFeatures({
  columnVisibilityFeature,
  rowSelectionFeature,
});
