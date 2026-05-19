import {
  AppProvider,
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  Badge
} from "@shopify/polaris";

export default function App() {
  return (
    <AppProvider i18n={{}}>
      <Page title="Auditly Pro">
        <Layout>

          <Layout.Section>
            <Card roundedAbove="sm">
              <BlockStack gap="400">

                <Text variant="heading2xl" as="h1">
                  Auditly Pro
                </Text>

                <Text variant="bodyLg" as="p">
                  Shopify Compliance & Optimization Platform
                </Text>

                <Badge tone="success">
                  System Online
                </Badge>

              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section oneHalf>
            <Card>
              <BlockStack gap="300">

                <Text variant="headingLg" as="h2">
                  Compliance Scanner
                </Text>

                <Text as="p">
                  Scan your store for:
                </Text>

                <ul>
                  <li>Missing policies</li>
                  <li>SEO problems</li>
                  <li>Theme issues</li>
                  <li>Accessibility issues</li>
                  <li>GDPR compliance</li>
                </ul>

                <Button primary>
                  Run Scan
                </Button>

              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section oneHalf>
            <Card>
              <BlockStack gap="300">

                <Text variant="headingLg" as="h2">
                  Store Health
                </Text>

                <Text as="p">
                  Overall optimization score:
                </Text>

                <Text variant="heading2xl" as="p">
                  94%
                </Text>

                <Badge tone="success">
                  Excellent
                </Badge>

              </BlockStack>
            </Card>
          </Layout.Section>

        </Layout>
      </Page>
    </AppProvider>
  );
      }
