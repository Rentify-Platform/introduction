interface IndexSettings {
   filterableAttributes?: string[]
   sortableAttributes?: string[]
   searchableAttributes?: string[]
}

class BootstrapIndex {
   updateSettings(_settings: IndexSettings): Promise<void> {
      return Promise.resolve()
   }
}

export class Meilisearch {
   constructor(_options: { host: string; apiKey?: string }) {}

   index(_name: string): BootstrapIndex {
      return new BootstrapIndex()
   }
}
