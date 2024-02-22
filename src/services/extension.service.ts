import { VaultExtension } from "~/extensions/todo";
import { entityService } from "./entity.service";
import { RootService } from "./root.service";


export class ExtensionService {

  loading = false;
  constructor(
    private readonly root: RootService,
    public readonly extensions: VaultExtension[]
  ) {
  }  

  private async loadExtensions() {
    const state = await this.getState()
    const newLoadedExtensionIds: string[] = []
    const promises = this.extensions.map(async (ext) => {
      

      if (!state.data.loadedExtensions.includes(ext.props.id)) {
        await this.loadExtension(ext)
        newLoadedExtensionIds.push(ext.props.id)
      }
    })

    await Promise.all(promises)

    if (newLoadedExtensionIds.length) {
      const loadedExtensions = state.data.loadedExtensions.concat(newLoadedExtensionIds)

      await this.root.db.updateTable('app_state')
        .where('type', '=', 'extension_state')
        .set({
          data: {
            loadedExtensions
          }
        })
        .execute()
    }
  }

  async loadExtension(ext: VaultExtension) {
    await entityService.insertTable(ext.props.data.name, ext.props.id, ext.props.data.schema)
  }

  getState() {
    return this.root.db.selectFrom('app_state')
      .where('type', '=', 'extension_state')
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  async load() {
    if (this.loading) return

    this.loading = true
    const state = await this.root.db.selectFrom('app_state')
      .where('type', '=', 'extension_state')
      .selectAll()
      .executeTakeFirst()

    if (!state) {
      await this.insertInitial()
    }

    await this.loadExtensions() 
  }

  private insertInitial() {
    this.root.db.insertInto('app_state').values({
      type: 'extension_state',
      data: {
        loadedExtensions: []
      }
    })
    .execute()
  }
}

