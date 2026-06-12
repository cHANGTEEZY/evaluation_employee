import { Platform, StyleSheet } from "react-native";

export const step0Styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  searchBar: {
    marginBottom: 8,
    elevation: 0,
  },
  searchResults: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    maxHeight: 220,
  },
  currentLocationButton: {
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
    height: 460,
    marginHorizontal: -20,
    marginBottom: 8,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  mapView: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centerPinOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -22,
    marginTop: -44,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
  },
  mapLoadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mapLoadingText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "500",
  },
  mapLegendOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    maxWidth: "95%",
  },
  addressBlock: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    color: "#ffffff",
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendLine: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  evalLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  evalSection: {
    marginTop: 4,
  },
  evalSectionTitle: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  evalCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  evalCardInner: {
    overflow: "hidden",
    borderRadius: 12,
  },
  cardHeader: {
    fontWeight: "700",
    fontSize: 14,
  },
  readOnlyTitle: {
    fontSize: 13,
    opacity: 0.65,
  },
  readOnlyDesc: {
    fontSize: 14,
    fontWeight: "500",
  },
  autoRiskRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  riskChip: {
    marginBottom: 4,
  },
});
