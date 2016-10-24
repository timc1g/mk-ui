
(function ( root, factory ) {
	//
	// AMD support
	// ---------------------------------------------------
	if ( typeof define === 'function' && define.amd ) {

		define( [ 'mknasty' ], function ( mk ) {
			return factory( root, mk );
		});
	}
	//
	// CommonJS module support
	// -----------------------------------------------------
	else if ( typeof module === 'object' && module.exports ) {

		module.exports = factory( root, require( 'mknasty' ));
	}
	//
	// Everybody else
	// -----------------------------------------------------
	else {
		return factory( root, root.mkNasty );
	}

})( typeof window !== "undefined" ? window : this, function ( root, mk ) { 

	mk.create( 'Selectmenu', {

		name: 'mk-selectmenu',

		templates: {

			shadow: [
				'<div class="{{$key}}-shadow{{if:classname}} {{classname}}{{/if:classname}}">',
					'{{template:trigger}}',
					'{{scope:list}}',
						'{{template:list}}',
					'{{/scope:list}}',
				'<div />'
			],

			trigger: [
				'<div class="{{$key}}-trigger {{if:disabled}} disabled{{/if:disabled}}" role="combobox" aria-haspopup="listbox">',
					'<input type="text" ',
						'class="{{$key}}-input" ',
						'readonly ',
						'aria-autocomplete="list" ',
						'aria-readonly="true" ',
						'aria-disabled="{{disabled}}" ',
						'{{if:multiple}}aria-multiselectable="true" {{/if:multiple}}',
						'value="{{label}}" />',
				'</div>'
			],

			list: [
				'<ul id="{{id}}" class="{{$key}}-list" role="listbox">',
					'{{loop:items}}',
						'{{template:item}}',
					'{{/loop:items}}',
				'</ul>'
			],

			item: [
				'<li class="{{$key}}-item" data-level="{{level}}" role="presentation">',
					'{{template:option}}',
				'</li>'
			],

			option: [
				'<a id="{{id}}" ',
					'class="{{$key}}-{{tagname}}{{if:classname}} {{classname}}{{/if:classname}}" ',
					'role="{{role}}" ',
					'href="javascript: void(0);" ',
					'aria-selected="{{selected}}" ',
					'aria-disabled="{{disabled}}" ',
					'data-value="{{value}}">',
					'<span class="{{$key}}-label">',
						'{{label}}',
					'</span>',
					'{{if:alt}}',
						'<span class="{{$key}}-alt">{{alt}}</span>',
					'{{/if:alt}}',
				'</a>'
			]
		},

		get version () {
			return 'v1.0.0';
		},

		get selectmenu () {
			return this.root[0];
		},

		get multiple () {
			return this.selectmenu.multiple;
		},

		get disabled () {
			return this.selectmenu.disabled;
		},

		get options () {
			return this.selectmenu.options || [];
		},

		get trigger () {
			return this.node('trigger', this.shadow);
		},

		get input () {
			return this.node('input', this.shadow);
		},

		get list () {
			return this.node('list', this.shadow);
		},

		get items () {
			return this.list.find(this.selector('item'));
		},

		get listOptions () {
			return this.list.find('[role="option"]');
		},

		get isHidden () {
			return this.trigger.attr(
				'aria-expanded') !== 'true';
		},

		get isOpen () {
			return this.trigger.attr(
				'aria-expanded') === 'true';
		},

		get value () {

			if (this.multiple) {

				var values = [];

				this.each(this.options, function(i, o) {
					if (o.selected) values.push(o.value);
				});
				return values;
			}
			return this.root[0].value;
		},

		_define: function (r, o) {

			var root = this.$(r);

			if (root.length < 1 || 
				root[0].tagName.toLowerCase() !== 'select') {
				throw new Error(':: mkNasty.Selectmenu - root must be a <select> node ::');
			}
			this.super(r, o);
		},

		_build: function () {

			this.shadow = 
				this.html('shadow', this.data())
					.insertAfter( this.selectmenu );

			if (this.transitions) {
				this.shadow.addClass('transitions');
			}
			
			var l = this.list,
				o = l.find('[aria-selected="true"]');

			this.trigger.attr({
				'aria-controls': l.attr('id'),
				'aria-activedescendant': o.attr('id')
			});

			this.root.attr('aria-hidden', 'true');
		},

		_bind: function () {

			var thiss = this,
				trigger = this.trigger, 
				inFocus = false,
				focusedByMouse = false;

			this.input
			.on('focus.mk', function (e) {
				
				if (thiss.disabled) {
					return;
				}

				if (focusedByMouse) {
					focusedByMouse = false;
					thiss.toggle();
				}

				trigger.addClass('focus');
				inFocus = true;
			})
			.on('blur.mk', function (e) {

				if (this.disabled) {
					return;
				}

				inFocus = false;
				thiss.blur();
			})
			.on('mousedown.mk', function (e) {

				focusedByMouse = true;

				if (inFocus) {
					focusedByMouse = false;
					thiss.toggle();
				}
			})
			.on('keydown.mk', function (e) {
				thiss._keydown(e);
			})
			.on('keypress.mk', function (e) {
				e.preventDefault();
				thiss.search(String.fromCharCode(e.which));
			});

			this.list
			.on('mousedown.mk', function (e) {
				e.preventDefault();
			})
			.on('click.mk', '[role="option"]', function (e) {
				e.preventDefault();
				thiss.select( this.getAttribute('data-value') );
			})
			.on('mouseover.mk', '[role="option"]', function (e) {
				thiss.activate(this);
			});
		},

		_keydown: function (e) {

			if (this.disabled) {
				return;
			}

			var w = e.which,
				k = this.keycode;

			switch (w) {

				case k.enter: 
					this._enter(e); 
					break;

				case k.space: 
					this._space(e); 
					break;

				case k.esc: 
					this._esc(e); 
					break;

				case k.up: 
				case k.down: 
					this.move(w === k.up); 
					break;

				case k.tab: 
					this._tab(e); 
					break;
			}
		},

		blur: function () {

			if (this.disabled) {
				return this.hide(0);
			}

			var t = this.trigger;
				t.removeClass('focus');

			if (this.isHidden) {

				var o = this.items.find('.active');

				if (o.attr('aria-selected') !== 'true') {
					this.select(o.attr('data-value'));
				}
			}

			this.updateLabel();
			return this.hide();
		},

		move: function (up) {

			var items   = this.items,
				active  = this.items.find('.active')[0],
				options = this.listOptions,
				option;

			if (typeof active === 'undefined') {

				active = items.find('[aria-selected="true"]')[0];

				if (typeof active === 'undefined') {
					active = options[0];
				}

				this.activate(active);
			}

			var increment = up && -1 || 1
				index = this.index(active) + increment;

			option = options[index];

			while (option 
				&& option.getAttribute('aria-disabled') === 'true') {

				index += increment;
				option = options[index];
			}

			if (typeof option === 'undefined') {

				option = up && options[0] 
					|| options[options.length - 1];
			}

			if (option !== active) {
				this.activate(option, true);
				this.scrollTo(option);
			}
		},

		_enter: function (e) {

			e.preventDefault();

			if (this.isHidden) {
				return this.show();
			}

			var active = this.items.find('.active'),
				value = active.attr('data-value');

			if (active.attr('aria-selected') !== 'true') {
				this.select(value);
			}
			else if (this.multiple) {
				this.deselect(value);
			}

			if (this.multiple !== true) {
				return this.hide();
			}
		},

		_space: function (e) {

			e.preventDefault();

			if (this.isHidden) {
				return this.show();
			}
			return this._enter(e);
		},

		_esc: function(e) {

			e.preventDefault();

			if (this.isOpen) {
				this.hide();
			}
			return this;
		},

		_tab: function (e) {

			if (this.isOpen) {

				e.preventDefault();

				var active = this.items.find('.active');

				if (this.multiple !== true 
					&& active.attr('aria-selected') !== 'true') {

					this.select(active.attr('data-value'));
				}

				this.hide();
			}
		},

		search: function (key) {

			if (this.disabled !== true && key) {

				if (this._timer) {
					clearTimeout(this._timer);
					this._timer = null;
				}

				this.query  = this.query || '';
				this.query += key;

				var option = this.getElementByLabel(this.query),
					thiss  = this;

				if (option) {
					this.activate(option, true);
				}

				this._timer = setTimeout(function () {
					thiss.query = '';
					thiss._timer = null;
				}, 500);
			}
		},

		index: function ( n ) {

			var index = 0;

			this.each(this.listOptions, function (i, o) {

				if (o === n) {
					index = i;
					return false;
				}
			});

			return index;
		},

		getOptgroupValue: function (node) {

			var c = node.children || [],
				v = [];

			this.each(c, function (i, o) {
				v.push(o.value);
			});
			return v.join('|||');
		},

		getElementByLabel: function (label) {

			var s = this.selector('label'),
				r = new RegExp('^' + label, 'i'),
				o = null, l;

			this.each(this.listOptions, function (i, option) {

				l = this.$(option).find(s).text();

				if (r.test(l)) {
					o = option; return false;
				}
			});

			return o;
		},

		getElementsByValue: function (v) {

			var items = this.listOptions,
				elems = {},
				item;

			this.each(items, function (i, el) {

				item = this.$(el);

				if (item.attr('data-value') === v) {

					elems.option = this.getOptionByValue(v);
					elems.item = item;
					return false;
				}
			});

			return elems;
		},

		getOptionByValue: function (v) {

			var option;

			this.each(this.options, function (i, o) {
				if (o.value === v) {
					option = o; return false;
				}
			});

			return option;
		},

		getLabelByElement: function (n) {

			var node = this.$(n),
				tag  = node.length > 0 
					&& node[0].tagName.toLowerCase() || '';

			if (tag === 'option') {
				return node[0].text;
			}

			return node.find(
				this.selector('label')).text();
		},

		updateLabel: function (n) {

			this.input.val(
				this.label(n));

			return this;
		},

		label: function (n) {

			var t = typeof n;

			if (t !== 'undefined') {

				if (t === 'string') {
					return n;
				}
				return this.getLabelByElement(n);
			}

			if (this.multiple) {
				return this.config.label || 'NEED LABEL';
			}

			var l = '';
			this.each(this.options, function (i, o) {
				if (o.selected) {
					l = o.text; return false;
				}
			});

			return l;
		},

		data: function () {

			var reg = new RegExp(' ' + this.name + ' ', 'i'),
				cls = ' ' + this.selectmenu.className + ' ';

			return { 
				label: this.label(),
				classname: cls.replace(reg, ''),
				multiple: this.multiple,
				disabled: this.disabled,
				list: {
					id: this.uid(), 
					items: this.getOptionData()
				} 
			};
		},

		getOptionData: function (nodes, items, level) {

			nodes = nodes || this.selectmenu.children || [];
			items = items || [];
			level = level || 0;

			this.each(nodes, function(i, node) {

				var tag = node.tagName.toLowerCase(),
					role = tag === 'option' && 'option' || this.multiple && 'option' || 'presentation';

				items.push({ 
					role: role,
					tagname: tag,
					level: level,
					classname: node.className,
					id: node.id || this.uid(),
					label: node.text || node.label, 
					selected: node.selected || false,
					disabled: node.disabled || false,
					alt: node.getAttribute('data-alt'),
					value: node.value || this.getOptgroupValue(node)
				});

				if (node.children && node.children.length > 0) {
					this.getOptionData(node.children, items, level+1);
				}
			});

			return items;
		},

		scrollTo: function (n) {

			var node = this.$(n);

			if (node.length) {

				var list = this.list[0],
					scroll = node[0].offsetTop,
					height = list.offsetHeight + list.offsetTop;

				if (scroll >= height) {
					list.scrollTop = scroll;
				}
			}
		},

		show: function () {

			var t = this.trigger,
				l = this.list;

			if (this.disabled !== true && this.isHidden) {

				this.transition(l, function () {
					l.addClass('in');
				});

				this.delay(function () {

					this.activate();

					t.attr('aria-expanded', 'true');
					l.attr('aria-hidden', 'false');
					
					this.emit('show');
				});
			}
			return this;
		},

		hide: function () {

			var t = this.trigger,
				l = this.list;

			if (this.isOpen) {

				this.transition(l, function () {
					l.removeClass('in');
				});

				this.delay(function () {

					t.attr('aria-expanded', 'false');
					l.attr('aria-hidden', 'true');

					this.emit('hide');
				});
			}
			return this;
		},

		toggle: function () {

			if (this.isHidden) {
				return this.show();
			}
			return this.hide();
		},

		activate: function (n, updateLabel) {

			var position = false;

			if (typeof n === 'undefined') {

				position = true;

				this.each(this.listOptions, function(i, l) {
					if (l.getAttribute('aria-selected') === 'true') {
						n = l; return false;
					}
				});
			}

			var node = this.$(n);

			if (node.length && node.attr('aria-disabled') !== 'true') {

				this.input.attr('aria-activedescendant', node.attr('id'));
				this.listOptions.removeClass('active');

				node.addClass('active');

				if (position) {
					this.scrollTo(n);
				}

				if (updateLabel) { 
					this.updateLabel(n);
				}

				this.emit('activate', node);
			}

			return this;
		},

		deselect: function (value, silent) {

			if (this.multiple) {

				var el = this.getElementsByValue(value);

				if (el.option.selected) {

					el.option.selected = false;
					el.item.attr('aria-selected', 'false');

					this.input.val(this.label());

					if (silent !== true) {
						this.emit('change', this.value);
					}
					return true;
				}
			}

			this.hide();

			return false;
		},

		select: function (value, silent) {

			var el = this.getElementsByValue(value),
				multiple = this.multiple;

			if (typeof el.option === 'undefined') {
				return this.selectGroup(value, silent);
			}

			if (el.option.disabled) { 
				return false;
			}

			if (el.option.selected) {
				this.deselect(value, silent);
				return false;
			}
			
			el.option.selected = true;

			if (multiple !== true) {
				this.listOptions.attr('aria-selected', 'false');
			}

			el.item.attr('aria-selected', 'true');

			this.input
				.attr('aria-activedescendant', el.item.attr('id'))
				.val(this.label());

			if (silent !== true) {
				this.emit('change', this.value);
			}

			if (multiple !== true) {
				this.hide();
			}

			return true;
		},

		selectGroup: function (value, silent) {

			var values = (value || '').split('|||');
			var tally  = 0;

			this.each(values, function (i, v) {

				var elems = this.getElementsByValue(v);

				if (elems.option.selected !== true) {
					this.select(v, true);
				} 
				else {
					tally++;
				}
			});

			if (tally === values.length) {
				this.each(values, function (i, v) {
					this.deselect(v);
				});
			}
			
			if (silent !== true) {
				this.emit('change', this.value);
			}

			return this;
		},

		disable: function () {

			this.selectmenu.disabled = true;
			this.input.attr('aria-disabled', 'true');
			this.trigger.addClass('disabled');
			this.emit('disabled');
			this.hide();

			return this;
		},

		enable: function () {

			this.selectmenu.disabled = false;
			this.input.attr('aria-disabled', 'false');
			this.trigger.removeClass('disabled');
			this.emit('enabled');

			return this;
		},

		update: function () {

			var d = this.data(),
				m = d.disabled && 'disable' || 'enable',
				i = this.input,
				l = this.html('list', data.list);

			this.items.remove();
			this.list.append(l.find(this.selector('item')));

			this[m]();

			i.attr('aria-multiselectable', 
					data.multiple && 'true' || 'false');

			i.val(this.label());

			this.emit('update');

			return this;
		},
	});

	return mk.get('Selectmenu');
});