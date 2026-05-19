import { Page, Card, Text, Button, BlockStack } from "@shopify/polaris";

export default function App() {
  return (
    <Page title="Auditly Pro">
      <BlockStack gap="400">

        <Card>
          <Text variant="headingLg" as="h2">
            Compliance Dashboard
          </Text>

          <Text>
            Scan your Shopify store for compliance issues.
          </Text>

          <Button primary>
            Run Scan
          </Button>
        </Card>

        <Card>
          <Text variant="headingMd">Store Health</Text>
          <Text variant="heading2xl">94%</Text>
        </Card>

      </BlockStack>
    </Page>
  );
}
