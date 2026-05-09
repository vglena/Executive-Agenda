import { Head, Main, NextScript } from 'next/document'

/**
 * Custom Pages Router document.
 * Uses a plain <html> element instead of Next.js's <Html> component to avoid
 * the HtmlContext singleton check that fails when static-generating Pages Router
 * error pages alongside App Router (pages.runtime is loaded in two worker
 * contexts, producing different context object identities).
 */
export default function Document() {
  return (
    <html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </html>
  )
}
