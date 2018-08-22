export interface Config {
  '$schema': string;
  version: string;
  bundles: Bundles;
  externals: Externals;
  localizedResources: LocalizedResources;
}

export interface LocalizedResources {
  [key: string]: string;
}

export interface Externals {
}

export interface Bundles {
  'navigation-control-application-customizer': Navigationcontrolapplicationcustomizer;
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