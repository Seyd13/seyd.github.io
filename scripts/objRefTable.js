const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.HTMLElement,
		C3.Plugins.TiledBg,
		C3.Plugins.System.Cnds.OnLayoutStart
	];
};
self.C3_JsPropNameTable = [
	{MapContainer: 0},
	{TiledBackground: 0},
	{TiledBackground2: 0}
];

self.InstanceType = {
	MapContainer: class extends self.IHTMLElementInstance {},
	TiledBackground: class extends self.ITiledBackgroundInstance {},
	TiledBackground2: class extends self.ITiledBackgroundInstance {}
}