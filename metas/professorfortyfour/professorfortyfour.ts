import * as ui from '../../node_modules/@dcl/ui-utils/uiDialog/index'
import { Dialog } from '../../node_modules/@dcl/ui-utils/utils/types'

export class Professor implements ISystem {
  // active gardens
  //todo get from an api
  static gardens: Array<string> = ["-104,-85","10,70","-114,-70","-115,-69","119,-20","-125,-67","-133,-68","-138,-124","-140,-50","140,-56","142,-59","-144,-123","144,-53","14,-86","150,4","18,-119","21,-125","2,-135","21,88","24,-137","-24,-23","-24,7","-26,-116","-27,4","28,-119","31,-65","32,67","3,-34","-35,-87","-38,-53","39,-122","-39,31","41,-1","4,-111","43,-1","-44,-110","45,-1","46,-1","-48,-56","-48,-57","49,-6","49,-91","5,-111","-55,-3","56,119","57,28","58,-24","60,-124","6,-111","62,29","-62,45","6,-64","-75,-63","88,29","90,135","-91,-91"]
  static randonGardenTeleport() {
    teleportTo(this.gardens[this.gardens.length * Math.random() | 0]) 
  }

  META_ID = 270 // Change to your MetaZone meta number identifier

  api = null
  host = null

  /// --- Lets make a 3D model ---
  professorModel = null

  /**
   * Initial scene setup, create all objects in the constructor.
   *
   * @param api          Used to call MetaZone API endpoints.
   * @param host_data    Very first
   */
  constructor(api, host_data) {
    // Save api
    this.api = api;

    let dialogWindow = new ui.DialogWindow()

    ///////// Your static scene assets ///////////
    // Initialize all scene entities here

    /// --- Lets spawn a 3d model ---
    this.professorModel = new Entity()
    this.professorModel.addComponent(new GLTFShape('metas/professorfortyfour/models/alice.glb'))
    this.professorModel.addComponent(new Transform({
      position: new Vector3(8, 1, 8)
    }))
    this.professorModel.addComponent(
      new OnPointerDown(
        e =>{
          if (!dialogWindow.isDialogOpen){
            dialogWindow.openDialogWindow(NPCTalk, 0)
          }
        },
        {
          button: ActionButton.POINTER,
          hoverText: 'Talk'
        }
      )
    )
    const ringsModel = new Entity()
    ringsModel.addComponent(new GLTFShape('metas/professorfortyfour/models/rings.glb'))
    ringsModel.addComponent(
      new Transform({
        position: new Vector3(0, -0.65, 0),
      })
    )
    ringsModel.setParent(this.professorModel)
    engine.addEntity(this.professorModel)

     ///////// Your static scene assets ///////////

    // Initial host data
    this.refreshHost(host_data)
  }

  /**
   * A Decentraland provided function where you should put your code that
   * repeats over and over.
   *
   * @param dt     Delta time since last update
   */
  update(dt: number) {
    // Note: your code that repeats goes here
    const dummyTarget = new Entity()
    dummyTarget.addComponent(new PlaneShape())
    dummyTarget.addComponent(new Transform())
    addFaceUserSystem(dummyTarget)

    // Track user's position
    dummyTarget.getComponent(Transform).position = this.professorModel
    .getComponent(Transform).position
    if (!this.professorModel.hasComponent(TrackUserSlerp))
    this.professorModel.addComponent(new TrackUserSlerp())
  }

  /**
   * A MetaZone provided function that contains data customized by the
   * landowner on the MetaZone.io system. This gets called every minute when it
   * is deployed live. During testing its called once in the game.ts file.
   *
   * @param host_data    Data sent from the MetaZone backend to update your Meta
   */
  refreshHost(host: Object) {
    // Save host info
    this.host = host

    // Parse metadata
    if(this.host.host_data) {
      let host_data = JSON.parse(this.host.host_data)

      ///////// Your landowner adjustable content ///////////
      // You decide which of your creation's entities the landowner can adjust.

      /// --- Lets adjust our 3d model ---
      this.professorModel.getComponent(Transform).position.set(
        host_data.meta.position.x,
        host_data.meta.position.y,
        host_data.meta.position.z
      )
      this.professorModel.getComponent(Transform).rotation.setEuler(
        host_data.meta.rotation.x,
        host_data.meta.rotation.y,
        host_data.meta.rotation.z
      )
      this.professorModel.getComponent(Transform).scale.set(
        host_data.meta.scale.x,
        host_data.meta.scale.y,
        host_data.meta.scale.z
      )

      ///////// Your landowner adjustable content ///////////
    }
  }

}

@Component("trackUserSlerp")
class TrackUserSlerp {
  fraction: number = 0
}

let currentCameraPosition = new Vector3()

// Rotates robot to face the user during interaction
export function addFaceUserSystem(dummyTarget: Entity) {
  class FaceUserSystem implements ISystem {
    private robotGroup: ComponentGroup = engine.getComponentGroup(
      TrackUserSlerp
    )

    update(dt: number) {
      for (let robot of this.robotGroup.entities) {
        let transform = robot.getComponent(Transform)
        let trackUserSlerp = robot.getComponent(TrackUserSlerp)
        
        // Check if player moves
        if(!currentCameraPosition.equals(Camera.instance.position)) {
          // Update current camera position
          currentCameraPosition.copyFrom(Camera.instance.position)
          trackUserSlerp.fraction = 0
        }

        dummyTarget.getComponent(Transform).lookAt(Camera.instance.position)

        trackUserSlerp.fraction += dt / 12

        if (trackUserSlerp.fraction < 1) {
          transform.rotation = Quaternion.Slerp(
            robot.getComponent(Transform).rotation,
            dummyTarget.getComponent(Transform).rotation,
            trackUserSlerp.fraction
          )
        }
      }
    }
  }

  engine.addSystem(new FaceUserSystem())
}

let NPCTalk: Dialog[] = [
  {
    text: 'Hi there, I am Professor Forty Four! I am here to help you navigate Ethermon location in Decentraland. Have you found a Garden to dig in yet?',
    isQuestion: true,
    labelE: { label: "YES", fontSize: 14 },
    ifPressE: 1,
    labelF: { label: "NO", fontSize: 14 },
    ifPressF: 2,
  },
  {
    text: 'Would you like me to teleport you to another an Ethermon Garden location to continute your search?',
    isQuestion: true,
    labelE: { label: "YES", fontSize: 14 },
    triggeredByE: () => {
      Professor.randonGardenTeleport()
    },
    ifPressE: 4,
    labelF: { label: "NO", fontSize: 14 },
    ifPressF: 5,
  },
  {
    text: 'Check near by for an Ethermon Garden, when you find one you can dig in it for a chance to find a rare egg or other goodies.',
  },
  {
    text: 'Come back here and I can teleport you to another garden location once you have found one!',
    isEndOfDialog: true,
  },
  {
    text: 'Bloop bloop bloop...oh you decided not to go, ok just let me know when you are ready',
    isEndOfDialog: true,
  },
  {
    text: 'Not ready to teleport yet? Just come back when you are ready to continue your adventure.',
    isEndOfDialog: true,
  },
]
