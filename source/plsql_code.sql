FUNCTION render_save_before_exit (
   p_dynamic_action IN APEX_PLUGIN.T_DYNAMIC_ACTION,
   p_plugin         IN APEX_PLUGIN.T_PLUGIN
)

   RETURN APEX_PLUGIN.T_DYNAMIC_ACTION_RENDER_RESULT

IS

   l_result                  APEX_PLUGIN.T_DYNAMIC_ACTION_RENDER_RESULT;
   l_save_message            VARCHAR2(4000);
   l_no_warning_sel          VARCHAR2(4000);
   l_ignore_modification_sel VARCHAR2(4000);
   l_disable_time            PLS_INTEGER;
   l_highlight_modifications VARCHAR2(1);
   l_crlf                    CHAR(2) := CHR(13)||CHR(10);

BEGIN

   l_save_message := NVL(p_dynamic_action.attribute_01,'You have made changes to data on this page. If you navigate away from this page without first saving your data, the changes will be lost.');
   l_no_warning_sel := NVL(p_dynamic_action.attribute_02,':button');
   l_ignore_modification_sel := NVL(p_dynamic_action.attribute_03, '#pRequest');
   l_disable_time := NVL(p_dynamic_action.attribute_04, 250);
   l_highlight_modifications := NVL(p_dynamic_action.attribute_05, 'Y');

   IF apex_application.g_debug
   THEN
      apex_plugin_util.debug_dynamic_action(
         p_plugin         => p_plugin,
         p_dynamic_action => p_dynamic_action
      );
   END IF;

   apex_javascript.add_library(
      p_name      => 'apex_save_before_exit.min',
      p_directory => p_plugin.file_prefix,
      p_version   => NULL
   );

   apex_css.add(
      p_css => '.apex-save-before-exit-highlight {background-color: #FFFFCC !important;border: 1px solid #CC9900 !important;padding: 2px !important;}',
      p_key => 'apex-save-before-exit-highlight'
   );

   l_result.javascript_function :=
         'function(){apex.jQuery(document).apexSaveBeforeExit({' || l_crlf
      || '   ' || apex_javascript.add_attribute('saveMessage',  l_save_message) || l_crlf
      || '   ' || apex_javascript.add_attribute('noWarningSelector',  l_no_warning_sel) || l_crlf
      || '   ' || apex_javascript.add_attribute('disableTime',  l_disable_time) || l_crlf
      || '   ' || apex_javascript.add_attribute('ignoreModificationsSelector',  l_ignore_modification_sel) || l_crlf
      || '   ' || apex_javascript.add_attribute('revertModificationsSelector',  l_revert_modification_sel) || l_crlf
      || '   ' || apex_javascript.add_attribute('highlightModifiedItems',  l_highlight_modifications, FALSE, FALSE) || l_crlf
      || '});}';

   RETURN l_result;

END render_save_before_exit;
