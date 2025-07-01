import Header from "@/components/Header";
import ServerList from "@/components/ServerList";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

async function getLanguages(): Promise<string[]> {
  "use cache";
  
  const languages = await prisma.server.findMany({
    distinct: ["localeCountry"],
    select: {
      localeCountry: true,
    },
  });

  const formattedLanguages = languages.map((lang) =>
    lang.localeCountry.toUpperCase()
  );

  return formattedLanguages;
}

export default async function Home() {
  // Only fetch languages on the server-side for immediate rendering
  const languages: string[] = await getLanguages();

  return (
    <div className="container">
      <Header languages={languages} />

      <div>
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <p className="text-white">Loading servers...</p>
            </div>
          </div>
        }>
          <ServerList />
        </Suspense>
      </div>
    </div>
  );
}
