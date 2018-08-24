import 'eonasdan-bootstrap-datetimepicker';
import moment from 'moment';

import './locationHistory';
import rawTemplate from './templates';
import setupComposerButton from './setupComposerButton';
import createEventFactory from './createEvent';
import parse, { inPost } from '../lib/parse';
import initResponses from './responses';
import initTranslation from './clientSideTranslation';
import initTranslatorModule from '../lib/translatorModule';

const lang = config.userLang || config.defaultLang;
jQuery.fn.size = jQuery.fn.size || function size() { return this.length; };

const begin = (momentLang) => {
  window.requirejs([
    'composer',
    'composer/formatting',
    'translator',
    'benchpress',
  ], (composer, formatting, translator, benchpress) => $(document).ready(() => {
    initTranslatorModule(translator.Translator);
    initTranslation(translator.Translator);

    benchpress.render('partials/calendar/event-creation-modal', {}).then(template => translator.translate(template, lang)).then((html) => {
      $('body').append(html);

      setupComposerButton(composer, translator);
      $('.plugin-calendar-event-editor-date').datetimepicker({
        icons: {
          time: 'fa fa-clock-o',
          date: 'fa fa-calendar',
          up: 'fa fa-arrow-up',
          down: 'fa fa-arrow-down',
          previous: 'fa fa-arrow-left',
          next: 'fa fa-arrow-right',
          today: 'fa fa-crosshairs',
          clear: 'fa fa-trash',
          close: 'fa fa-times',
        },
        allowInputToggle: true,
        locale: momentLang,
        sideBySide: true,
        useCurrent: true,
      });
      const createEvent = createEventFactory();

      const prepareFormattingTools = () => {
        if (!formatting) {
          return;
        }

        formatting.addButtonDispatch('plugin-calendar-event', (textarea) => {
          const $textarea = $(textarea);
          const oldVal = $textarea.val();
          const oldEvent = parse(oldVal.replace(/\[(\/?)event-invalid\]/g, '[$1event]'));
          createEvent(oldEvent || {}, (event) => {
            const text = event ? rawTemplate(event) : '';
            if (inPost.test(oldVal)) {
              const newVal = oldVal.replace(
                /\[event(?:-invalid)?\][\s\S]+\[\/event(?:-invalid)?\]/g,
                text
              );
              $textarea.val(newVal);
            } else {
              $textarea.val(`${oldVal}\n\n${text}`);
            }
            $textarea.trigger('input');
          });
        });
      };

      $(window).on('action:composer.enhanced', prepareFormattingTools);

      initResponses();
    });
  }));
};

// eslint-disable-next-line camelcase, no-undef
__webpack_public_path__ = `${RELATIVE_PATH}/plugins/nodebb-plugin-calendar/bundles/`;

let momentLang = lang.toLowerCase().replace(/_/g, '-');
if (momentLang === 'en-us') {
  begin('en-us');
} else {
  import(`moment/locale/${momentLang}`).catch((err) => {
    // eslint-disable-next-line no-console
    console.info(`could not load locale data (${momentLang}) for moment`, err);
    [momentLang] = momentLang.split('-');
    return import(`moment/locale/${momentLang}`);
  }).then(() => {
    moment.locale(momentLang);
    begin(momentLang);
  }).catch((err) => {
    begin('en-us');
    // eslint-disable-next-line no-console
    console.info(`could not load locale data (${momentLang}) for moment`, err);
  });
}
