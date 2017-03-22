define(["jquery", "knockout", "config/config", "service", "underscore"], function ($, ko, config, service) {
	function superVM() {
		var self = this,
		b = service.getV4Switch();
		self.openEnable = ko.observable(b.pin_interlock_and_V4_lock);
		self.lockcellEnable = ko.observable(b.lock_zone_enable);
		self.v4code0 = ko.observable("");
		self.v4code1 = ko.observable("");
		self.v4code2 = ko.observable("");
		b = service.getCellId().cell_id_list.split(",");
		self.cell_id1 = ko.observable(d(b[0]));
		self.cell_id2 = ko.observable(d(b[1]));
		self.cell_id3 = ko.observable(d(b[2]));
		self.cell_id4 = ko.observable(d(b[3]));
		self.cell_id5 = ko.observable(d(b[4]));
		self.setV4Mode = function () {
			showConfirm("v4_note", function () {
				showLoading();
				service.setV4Switch({
					pin_interlock_and_V4_lock : self.openEnable(),
					TspLock_key_data : self.v4code0() + self.v4code1() + self.v4code2()
				}, function (data) {
					data && "success" == data.result ? service.restart({}, function (data) {
						data && "success" == data.result ? successOverlay() : errorOverlay()
					}, $.noop) : errorOverlay()
				})
			})
		};
		self.setCellIdMode = function () {
			showLoading();
			service.setCellIdSwitch({
				lock_zone_enable : self.lockcellEnable()
			}, function (data) {
				data && "success" == data.result ? successOverlay() : errorOverlay()
			})
		}
	}
	function d(a) {
		return a && "" != a && "0.0.0.0" != a ? a : "— —"
	}
	return {
		init : function () {
			var container = $("#container");
			ko.cleanNode(container[0]);
			var vm = new superVM;
			ko.applyBindings(vm, container[0]);
			$("#v4EncodeForm").validate({
				submitHandler : function () {
					vm.setV4Mode()
				},
				rules : {
					v4code0 : "v4_check",
					v4code1 : "v4_check",
					v4code2 : "v4_check"
				}
			});
			$("#LockCellForm").validate({
				submitHandler : function () {
					vm.setCellIdMode()
				}
			});
			addInterval(function () {
				service.getCellId({}, function (data) {
					var ids = data.cell_id_list.split(",");
					vm.cell_id1(d(ids[0]));
					vm.cell_id2(d(ids[1]));
					vm.cell_id3(d(ids[2]));
					vm.cell_id4(d(ids[3]));
					vm.cell_id5(d(ids[4]))
				})
			},1E3)
		}
	}
});
