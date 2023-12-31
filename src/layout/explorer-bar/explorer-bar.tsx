import { useQuery } from "~/context/database-context";
import { useAppStateService } from "~/features/app-state";
import { Entity } from "~/types/db-types";

export const ExplorerBar = () => {
  const appState = useAppStateService()

  const entities = useQuery<Entity[]>(
    "SELECT * FROM entity WHERE type IN ('table', 'document') ORDER BY created_at DESC"
  ).data;


  const onSelectEntity = (entity: Entity) => {
    appState.setSelectedEntityId(entity.id)
  }
  
  return (
    <div className="w-full h-full py-3 px-5">
      <div>
        <div>
          {entities.map((d) => (<button className="w-full text-left text-sm"  key={d.id} onClick={() => onSelectEntity(d)}>{`${d.id}:${d.type}:${d.title}`}</button>))}

        </div>
      </div>
    </div>
  )
}