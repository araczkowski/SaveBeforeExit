'use strict';
//var apex, CKEDITOR, $v;
(function ($) {
    $.widget('ui.apexSaveBeforeExit', {
        options: {
            saveMessage: null,
            noWarningSelector: null,
            disableTime: null,
            ignoreModificationsSelector: null,
            revertModificationsSelector: null,
            highlightModifiedItems: null,
            debug: $('#pdebug').length !== 0 //true boolean for ===
        },
        _createPrivateStorage: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _createPrivateStorage (start)');
            }

            uiw._values = {
                itemModified: false,
                promptUser: true,
                forcePrompt: false
            };

            uiw._elements = {
                $modifiedItems: $() //empty jQuery object
            };

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _createPrivateStorage (end)');
            }
        },
        _create: function () {
            var uiw = this;
            var $ignoreElmts;
            var $revertElmts;
            var $noWarnElmts;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _create (start)');
                apex.debug('...Options');

                for (var name in uiw.options) {
                    apex.debug('......' + name + ': "' + uiw.options[name] + '"');
                }
            }

            uiw._createPrivateStorage();

            if (uiw.options.ignoreModificationsSelector === undefined || uiw.options.ignoreModificationsSelector === null) {
                uiw.options.ignoreModificationsSelector = '';
            }

            //This debug output was added here to provide some feedback during initialization
            if (uiw.options.debug) {
                $ignoreElmts = $(uiw.options.ignoreModificationsSelector);

                if ($ignoreElmts.length) {
                    $ignoreElmts.each(function () {
                        apex.debug('...Ignore modifications to: "' + this.nodeName + '"');

                        for (var name in this.attributes) {
                            if (typeof (this.attributes[name]) !== 'function') {
                                apex.debug('......' + this.attributes[name].nodeName + ': "' + this.attributes[name].nodeValue + '"');
                            }
                        }
                    });
                } else {
                    apex.debug('...No elements selected to ignore modifications to');
                }
            }


            //
            apex.debug('revertModificationsSelector: ' + uiw.options.revertModificationsSelector);

            if (uiw.options.revertModificationsSelector === undefined || uiw.options.revertModificationsSelector === null) {
                uiw.options.revertModificationsSelector = '';
            }

            //This debug output was added here to provide some feedback during initialization
            if (uiw.options.debug) {
                $revertElmts = $(uiw.options.revertModificationsSelector);

                if ($revertElmts.length) {
                    $revertElmts.each(function () {
                        apex.debug('...Ignore modifications to: "' + this.nodeName + '"');

                        for (var name in this.attributes) {
                            if (typeof (this.attributes[name]) !== 'function') {
                                apex.debug('......' + this.attributes[name].nodeName + ': "' + this.attributes[name].nodeValue + '"');
                            }
                        }
                    });
                } else {
                    apex.debug('...No elements selected to ignore modifications to');
                }
            }
            //

            if (uiw.options.noWarningSelector === undefined || uiw.options.noWarningSelector === null) {
                uiw.options.noWarningSelector = '';
            }

            $noWarnElmts = $(uiw.options.noWarningSelector);

            if (uiw.options.debug && !$noWarnElmts.length) {
                apex.debug('...No elements selected to allow leaving without warnings');
            }

            $noWarnElmts
                .each(function () {
                    var $this = $(this);
                    var onClickHandler = $this.prop('onclick');

                    if (uiw.options.debug) {
                        apex.debug('...Disable warnings for: "' + this.nodeName + '"');

                        for (var name in this.attributes) {
                            if (typeof (this.attributes[name]) !== 'function') {
                                apex.debug('......' + this.attributes[name].nodeName + ': "' + this.attributes[name].nodeValue + '"');
                            }
                        }
                    }

                    if (onClickHandler) {
                        $this
                            .removeAttr('onclick')
                            .prop('onclick', null)
                            .click(function () {
                                uiw._disableWarningTemp();
                                onClickHandler();
                            });
                    } else {
                        $this
                            .click(function () {
                                uiw._disableWarningTemp();
                            });
                    }
                });

            // Revert Modifications - on change
            $(uiw.options.revertModificationsSelector)
                .each(function () {
                    $(this).change(function () {
                        // check if we have modification on page
                        if (apex.jQuery(document).apexSaveBeforeExit('modificationDetected')) {

                            var r = window.confirm(uiw.options.saveMessage);
                            if (r === true) {
                                //do what you have to do
                                apex.submit(this.id);
                            } else {
                                // restrore value for item and stay on page
                                var itemId = this.id;
                                if (uiw.options.debug) {
                                    apex.log('REVERT VALUE FOR: ' + itemId);
                                }

                                if (this.length) {
                                    // Select List
                                    for (var x = 0; x < this.length; x++) {
                                        if (this.options[x].defaultSelected) {
                                            if (uiw.options.debug) {
                                                apex.log('text: ' + this.options[x].text);
                                                apex.log('value: ' + this.options[x].value);
                                            }
                                            apex.item(itemId).setValue(this.options[x].value);
                                        }
                                    }
                                } else {
                                    // radio button or chkbox
                                    $('[id^=' + itemId + ']').each(function () {
                                        if (this.defaultChecked) {
                                            if (uiw.options.debug) {
                                                apex.log(this.value);
                                            }
                                            apex.item(itemId).setValue(this.value);
                                        }
                                    });
                                }
                            }
                        }
                    });
                });

            window.onbeforeunload = function () {
                if (uiw._values.forcePrompt) {
                    if ($.browser.msie) { //fix IE issue regarding anchors with "javascript:" that cause multiple warnings.
                        uiw._disableWarningTemp();
                    }

                    return uiw.options.saveMessage;
                } else if (uiw._values.promptUser) {
                    if (uiw.options.highlightModifiedItems === 'Y') {
                        uiw._detectModifications(false, true, false);
                    } else {
                        uiw._detectModifications(true, false, false);
                    }

                    if (uiw._values.itemModified === false) {
                        return;
                    }

                    if ($.browser.msie) { //fix IE issue regarding anchors with "javascript:" that cause multiple warnings.
                        uiw._disableWarningTemp();
                    }

                    if (uiw._values.itemModified) {
                        return uiw.options.saveMessage;
                    }
                }
            };

            $('form#wwvFlowForm fieldset.shuttle')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    var loadVal = $v(this.id);

                    $(this).data('apex-sbe-load-val', loadVal);
                });

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _create (end)');
            }
        },
        _disableWarningTemp: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _disableWarningTemp (start)');
            }

            uiw._values.promptUser = false;

            setTimeout(function () {
                uiw.enableWarning();
            }, uiw.options.disableTime); // Use closure to re-enable shortly.

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _disableWarningTemp (end)');
            }
        },
        _detectModifications: function (shortCircuit, highlightModifiedItems, trackModifiedItems) {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: _detectModifications (start)');
            }

            uiw._values.itemModified = false;
            uiw._elements.$modifiedItems = $();

            if (highlightModifiedItems) {
                $('.apex-save-before-exit-highlight').removeClass('apex-save-before-exit-highlight');
            }

            $('form#wwvFlowForm input[type="text"],' +
                'form#wwvFlowForm input[type="file"],' +
                'form#wwvFlowForm input[type="password"],' +
                'form#wwvFlowForm input[type="hidden"]')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    if (this.value !== this.defaultValue) {
                        uiw._values.itemModified = true;

                        if (trackModifiedItems) {
                            uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add(this);
                        }

                        if (highlightModifiedItems) {
                            $(this).addClass('apex-save-before-exit-highlight');
                        }

                        if (uiw.options.debug) {
                            apex.debug('...Modification detected on: "' + this.id + '"');
                            apex.debug('......Default Value: "' + this.defaultValue + '"');
                            apex.debug('......Current Value: "' + this.value + '"');
                        }

                        if (shortCircuit) {
                            return false;
                        }
                    }
                });

            if (shortCircuit && uiw._values.itemModified === true) {
                return true;
            }

            $('form#wwvFlowForm input[type="radio"],' +
                'form#wwvFlowForm input[type="checkbox"]')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    if (this.checked !== this.defaultChecked) {
                        uiw._values.itemModified = true;

                        if (trackModifiedItems) {
                            uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add($(this).closest('fieldset'));
                        }

                        if (highlightModifiedItems) {
                            $(this).closest('fieldset').addClass('apex-save-before-exit-highlight');
                        }

                        if (uiw.options.debug) {
                            apex.debug('...Modification detected on: "' + this.id + '"');
                            apex.debug('......Default Checked: "' + this.defaultChecked + '"');
                            apex.debug('......Current Checked: "' + this.checked + '"');
                        }

                        if (shortCircuit) {
                            return false;
                        }
                    }
                });

            if (shortCircuit && uiw._values.itemModified === true) {
                return true;
            }

            $('form#wwvFlowForm fieldset.shuttle')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    var currVal = $v(this.id);
                    var dfltVal = $(this).data('apex-sbe-load-val');

                    if (dfltVal === undefined) {
                        dfltVal = '';
                    }

                    if (currVal !== dfltVal) {
                        uiw._values.itemModified = true;

                        if (trackModifiedItems) {
                            uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add(this);
                        }

                        if (highlightModifiedItems) {
                            $(this).addClass('apex-save-before-exit-highlight');
                        }

                        if (uiw.options.debug) {
                            apex.debug('...Modification detected on: "' + this.id + '"');
                            apex.debug('......Default Value: "' + dfltVal + '"');
                            apex.debug('......Current Value: "' + currVal + '"');
                        }

                        if (shortCircuit) {
                            return false;
                        }
                    }
                });

            if (shortCircuit && uiw._values.itemModified === true) {
                return true;
            }

            $('form#wwvFlowForm select:not(.shuttle_left,.shuttle_right)')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    for (var x = 0; x < this.length; x++) {
                        if (this.options[x].selected !== this.options[x].defaultSelected) {
                            uiw._values.itemModified = true;

                            if (trackModifiedItems) {
                                uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add(this);
                            }

                            if (highlightModifiedItems) {
                                $(this).addClass('apex-save-before-exit-highlight');
                            }

                            if (uiw.options.debug) {
                                apex.debug('...Modification detected on: "' + this.id + '" (' + this.options[x].text + ')');
                                apex.debug('......Default Selected: "' + this.options[x].defaultSelected + '"');
                                apex.debug('......Current Selected: "' + this.options[x].selected + '"');
                            }

                            if (shortCircuit) {
                                return false;
                            }
                        }
                    }
                });

            if (shortCircuit && uiw._values.itemModified === true) {
                return true;
            }

            $('form#wwvFlowForm textarea:not(.rich_text_editor)')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    if (this.value !== this.defaultValue) {
                        uiw._values.itemModified = true;

                        if (trackModifiedItems) {
                            uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add(this);
                        }

                        if (highlightModifiedItems) {
                            $(this).addClass('apex-save-before-exit-highlight');
                        }

                        if (uiw.options.debug) {
                            apex.debug('...Modification detected on: "' + this.id + '"');
                            apex.debug('......Default Value: "' + this.defaultValue + '"');
                            apex.debug('......Current Value: "' + this.value + '"');
                        }

                        if (shortCircuit) {
                            return false;
                        }
                    }
                });

            if (shortCircuit && uiw._values.itemModified === true) {
                return true;
            }

            $('form#wwvFlowForm textarea.rich_text_editor')
                .not(uiw.options.ignoreModificationsSelector)
                .each(function () {
                    try {
                        if (CKEDITOR.instances[this.id].checkDirty()) {
                            uiw._values.itemModified = true;

                            if (trackModifiedItems) {
                                uiw._elements.$modifiedItems = uiw._elements.$modifiedItems.add(this);
                            }

                            if (highlightModifiedItems) {
                                $(this).closest('td').addClass('apex-save-before-exit-highlight');
                            }

                            if (uiw.options.debug) {
                                apex.debug('...Modification detected on: "' + this.id + '"');
                                apex.debug('......Default Value: "' + this.defaultValue + '"');
                                apex.debug('......Current Value: "' + CKEDITOR.instances[this.id].getData() + '"');
                            }

                            if (shortCircuit) {
                                return false;
                            }
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
        },
        modificationDetected: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: modificationDetected (start)');
            }


            uiw._detectModifications(true, false, false);

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: modificationDetected (end)');
            }

            return uiw._values.itemModified;
        },
        modifiedItems: function (opts) {
            var uiw = this;
            var defaults = {
                highlight: false
            };
            var options = $.extend(defaults, opts);

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: modifiedItems (start)');
            }

            uiw._detectModifications(false, options.highlight, true);

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: modifiedItems (end)');
            }

            return uiw._elements.$modifiedItems;
        },
        enableWarning: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: enableWarning (start)');
            }

            uiw._values.promptUser = true;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: enableWarning (end)');
            }
        },
        disableWarning: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: disableWarning (start)');
            }

            uiw._values.promptUser = false;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: disableWarning (end)');
            }
        },
        enableWarningForce: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: enableWarningForce (start)');
            }

            uiw._values.forcePrompt = true;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: enableWarningForce (end)');
            }
        },
        disableWarningForce: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: disableWarningForce (start)');
            }

            uiw._values.forcePrompt = false;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: disableWarningForce (end)');
            }
        },
        warningForceEnabled: function () {
            var uiw = this;

            if (uiw.options.debug) {
                apex.debug('Save Before Exit: warningForceEnabled (start/end)');
            }

            return uiw._values.forcePrompt;
        }
    });
})(apex.jQuery);
