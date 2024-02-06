import { Extension } from "../extension";

export function flattenExtensions(extensions: Extension[]): Extension[] {
  return extensions.flatMap((ext) => {
    let innerExtensions = [ext]
    if (ext.config.extensions) {
      const extensions = ext.config.extensions.call({
        options: ext.options
      })
      innerExtensions = [...innerExtensions, ...extensions]  
    }

    return innerExtensions
  })
}