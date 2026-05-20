import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  Badge
} from "@shopify/polaris";

export default function App() {

  const [shop, setShop] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setShop(params.get("shop"));
  }, []);

  async function runScan() {

    const res = await fetch(`/api/scan?shop=${shop}`);
    const data = await res.json();

    alert(`Score: ${data.score}`);
  }

  return (
    <Page title="Auditly Pro">

      <BlockStack gap="500">

        <Card>
          <BlockStack gap="300">

            <Text variant="headingLg">
              Auditly Pro Dashboard
            </Text>

            <Badge tone="success">
              Embedded Active
            </Badge>

            <Text>
              Store: {shop}
            </Text>

            <Button primary onClick={runScan}>
              Run Compliance Scan
            </Button>

          </BlockStack>
        </Card>

        <Card>
          <Text variant="headingMd">
            SaaS Status
          </Text>

          <Text variant="heading2xl">
            $27/month Active Model Ready
          </Text>
        </Card>

      </BlockStack>

    </Page>
  );
}
