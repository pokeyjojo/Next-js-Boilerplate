/* eslint-disable react-dom/no-unsafe-target-blank */
import Image from 'next/image';

export const Sponsors = () => (
  <div className="overflow-x-auto">
    <table className="border-collapse w-full min-w-full">
      <tbody>
        <tr className="h-40 sm:h-56">
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a
              href="https://clerk.com?utm_source=github&utm_medium=sponsorship&utm_campaign=nextjs-boilerplate"
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Image
                src="/assets/images/clerk-logo-dark.png"
                alt="Clerk – Authentication & User Management for Next.js"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a href="https://www.coderabbit.ai?utm_source=next_js_starter&utm_medium=github&utm_campaign=next_js_starter_oss_2025" target="_blank" rel="noopener" className="block">
              <Image
                src="/assets/images/coderabbit-logo-light.svg"
                alt="CodeRabbit"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a
              href="https://sentry.io/for/nextjs/?utm_source=github&utm_medium=paid-community&utm_campaign=general-fy25q1-nextjs&utm_content=github-banner-nextjsboilerplate-logo"
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Image
                src="/assets/images/sentry-dark.png"
                alt="Sentry"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
        </tr>
        <tr className="h-40 sm:h-56">
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a href="https://launch.arcjet.com/Q6eLbRE" className="block">
              <Image
                src="/assets/images/arcjet-light.svg"
                alt="Arcjet"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a href="https://sevalla.com/" className="block">
              <Image
                src="/assets/images/sevalla-light.png"
                alt="Sevalla"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a href="https://l.crowdin.com/next-js" target="_blank" rel="noopener" className="block">
              <Image
                src="/assets/images/crowdin-dark.png"
                alt="Crowdin"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
        </tr>
        <tr className="h-40 sm:h-56">
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a
              href="https://posthog.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate"
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Image
                src="https://posthog.com/brand/posthog-logo.svg"
                alt="PostHog"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a
              href="https://betterstack.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate"
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Image
                src="/assets/images/better-stack-dark.png"
                alt="Better Stack"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a
              href="https://www.checklyhq.com/?utm_source=github&utm_medium=sponsorship&utm_campaign=next-js-boilerplate"
              target="_blank"
              rel="noopener"
              className="block"
            >
              <Image
                src="/assets/images/checkly-logo-light.png"
                alt="Checkly"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
        </tr>
        <tr className="h-40 sm:h-56">
          <td className="border-2 border-gray-300 p-2 sm:p-3">
            <a href="https://nextjs-boilerplate.com/pro-saas-starter-kit" className="block">
              <Image
                src="/assets/images/nextjs-boilerplate-saas.png"
                alt="Next.js SaaS Boilerplate"
                width={260}
                height={224}
                className="w-full h-auto max-w-[200px] sm:max-w-[260px]"
              />
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
);
