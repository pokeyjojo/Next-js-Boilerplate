import { useTranslations } from 'next-intl';
import { AppConfig } from '@/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 text-[#BFC3C7] antialiased bg-[#002C4D] min-h-screen">
      <div className="mx-auto max-w-screen-lg">
        <header className="border-b border-[#69F0FD]">
          <div className="pb-6 pt-12 sm:pb-8 sm:pt-16">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#BFC3C7]">
              {AppConfig.name}
            </h1>
            <h2 className="text-lg sm:text-xl text-[#7F8B95]">{t('description')}</h2>
          </div>

          {/* Mobile: Stack navigation vertically */}
          <div className="lg:flex lg:justify-between">
            <nav className="mb-4 lg:mb-0">
              <ul className="flex flex-wrap gap-x-3 sm:gap-x-5 text-lg sm:text-xl">
                {props.leftNav}
              </ul>
            </nav>

            {props.rightNav && (
              <nav>
                <ul className="flex flex-wrap gap-x-3 sm:gap-x-5 text-lg sm:text-xl">
                  {props.rightNav}
                </ul>
              </nav>
            )}
          </div>
        </header>

        <main className="py-4 sm:py-6">{props.children}</main>

        <footer className="border-t border-[#69F0FD] py-6 sm:py-8 text-center text-sm text-[#7F8B95]">
          {`© Copyright ${new Date().getFullYear()} ${AppConfig.name}. `}
          {t.rich('made_with', {
            author: () => (
              <a
                href="https://creativedesignsguru.com"
                className="text-[#69F0FD] hover:border-b-2 hover:border-[#69F0FD] transition-colors"
              >
                CreativeDesignsGuru
              </a>
            ),
          })}
          {/*
           * PLEASE READ THIS SECTION
           * I'm an indie maker with limited resources and funds, I'll really appreciate if you could have a link to my website.
           * The link doesn't need to appear on every pages, one link on one page is enough.
           * For example, in the `About` page. Thank you for your support, it'll mean a lot to me.
           */}
        </footer>
      </div>
    </div>
  );
};
