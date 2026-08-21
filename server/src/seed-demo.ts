import 'dotenv/config'
import { DEMO_ACCOUNTS, readDemoSeedEnvironment, seedDemoData } from './demo-seed'
import { PrismaService } from './prisma/prisma.service'

async function main() {
   const passwords = readDemoSeedEnvironment()
   const prisma = new PrismaService()
   try {
      const summary = await seedDemoData(prisma, passwords)
      console.log('Development demo seed completed.', summary)
      console.log('Demo emails:', DEMO_ACCOUNTS.map((account) => account.email).join(', '))
   } finally {
      await prisma.onModuleDestroy()
   }
}

main().catch((error: unknown) => {
   console.error(error instanceof Error ? error.message : 'Development demo seed failed.')
   process.exitCode = 1
})
