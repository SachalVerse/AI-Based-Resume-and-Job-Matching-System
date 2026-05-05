"use client";

import React from "react";
import { Page, Text, View, Document, Link } from "@react-pdf/renderer";
import { styles } from "./pdf-styles";
import { ResumeData, ResumeField } from "@/types/resume";

function PDFField({ field }: { field: ResumeField }) {
  switch (field.type) {
    case "heading":
      return (
        <View style={styles.entryContainer}>
          <View style={styles.entryRow}>
            <Text style={styles.headingPrimaryLeft}>{field.value}</Text>
            {field.right?.primary && (
              <Text style={styles.headingPrimaryRight}>{field.right.primary}</Text>
            )}
          </View>
          {(field.subtitle || field.right?.secondary) && (
            <View style={styles.entryRow}>
              {field.subtitle ? (
                <Text style={styles.headingSecondaryLeft}>{field.subtitle}</Text>
              ) : (
                <Text style={styles.headingSecondaryLeft}> </Text>
              )}
              {field.right?.secondary && (
                <Text style={styles.headingSecondaryRight}>{field.right.secondary}</Text>
              )}
            </View>
          )}
        </View>
      );
    case "text":
      return <Text style={styles.text}>{field.value}</Text>;
    case "bullet":
      return (
        <View style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{field.value}</Text>
        </View>
      );
    case "link":
      return (
        <Link src={field.url || "#"} style={styles.link}>
          {field.value}
        </Link>
      );
    case "divider":
      return <View style={styles.divider} />;
    default:
      return null;
  }
}

export default function PDFResume({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{data.name}</Text>
          <View style={{ height: 20 }} />
          <View style={styles.contactRow}>
            {data.contact.map((c, i) => (
              <React.Fragment key={c.id}>
                {c.url ? (
                  <Link src={c.url} style={styles.contactLink}>{c.value}</Link>
                ) : (
                  <Text style={styles.contactText}>{c.value}</Text>
                )}
                {i < data.contact.length - 1 && <Text style={styles.contactSep}>|</Text>}
              </React.Fragment>
            ))}
          </View>
        </View>

        {data.sections.map((section) => (
          <View key={section.id}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionBody}>
              {section.fields.map((field, idx) => (
                <PDFField key={idx} field={field} />
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
