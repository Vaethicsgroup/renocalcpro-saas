import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: path.resolve("."),
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default withNextIntl(nextConfig);
