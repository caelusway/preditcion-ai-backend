import { prisma } from '../src/lib/prisma';

async function main() {
  // Check matches with odds vs without
  const allMatches = await prisma.match.findMany({
    where: { status: 'finished' },
    select: { externalData: true, kickoffTime: true, league: true },
    orderBy: { kickoffTime: 'desc' }
  });
  
  let withOdds = 0;
  let withoutOdds = 0;
  let dates: string[] = [];
  
  for (const m of allMatches) {
    const ext = m.externalData as any;
    if (ext?.odds?.bookmakers?.[0]) {
      withOdds++;
      if (dates.length < 3) {
        dates.push(m.kickoffTime.toISOString().split('T')[0] + ' (' + m.league + ')');
      }
    } else {
      withoutOdds++;
    }
  }
  
  console.log('Matches WITH odds:', withOdds);
  console.log('Matches WITHOUT odds:', withoutOdds);
  console.log('Sample dates with odds:', dates.join(', '));
}
main();
