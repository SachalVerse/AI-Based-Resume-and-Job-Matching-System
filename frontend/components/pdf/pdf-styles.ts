import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingLeft: 36,
    paddingRight: 36,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.2,
    color: "#000",
  },
  header: {
    textAlign: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 26, 
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 0, // Margin handled by spacer View
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 10.5,
  },
  contactLink: {
    fontSize: 10.5,
    color: "#000",
    textDecoration: "underline",
  },
  contactSep: {
    fontSize: 10.5,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 2,
  },
  sectionBody: {
    marginTop: 2,
  },
  entryContainer: {
    marginBottom: 10,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  headingPrimaryLeft: {
    fontWeight: "bold",
    fontSize: 11,
  },
  headingPrimaryRight: {
    fontSize: 11,
  },
  headingSecondaryLeft: {
    fontSize: 10,
    fontStyle: "italic",
  },
  headingSecondaryRight: {
    fontSize: 10,
    fontStyle: "italic",
  },
  text: {
    fontSize: 10.5,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 4,
    paddingLeft: 12,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    textAlign: "left",
  },
  link: {
    fontSize: 10.5,
    color: "#000",
    textDecoration: "underline",
  },
  divider: {
    marginTop: 4,
    marginBottom: 4,
  },
});
