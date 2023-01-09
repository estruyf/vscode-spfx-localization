export interface Config {
  '$schema': string;
  localizedResources: LocalizedResources;
}

export interface LocalizedResources {
  [key: string]: string;
}

export interface Navigationcontrolapplicationcustomizer {
  components: Component[];
}

export interface Component {
  entrypoint: string;
  manifest: string;
}

export interface LocalizedResourceValue {
  key: string;
  value: string;
}