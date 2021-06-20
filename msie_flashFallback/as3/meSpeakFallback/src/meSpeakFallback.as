/*
  meSpeakFallback.as
  An experimental fallback option for meSpeak to play wav files
  Wav-files are sent as a plain array of uint 8-bit data via ExternalInterface

  JS interface:
    meSpeakFallback.play( <wav-array> );
    meSpeak.setVolume( value )           // 0 >= value <= 1

  Handshake: calls JS function 'meSpeakFallbackHandshake()', when initialized and ready
 
  Norbert Landsteiner, www.masswerk.at, July 2013
*/
package {
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.media.Sound;
	import flash.media.SoundTransform;
	import flash.utils.ByteArray;
	import flash.utils.setTimeout;
	
	import org.as3wavsound.WavSound;
	import org.as3wavsound.WavSoundChannel;

	public class meSpeakFallback extends Sprite
	{
		private var sndTransform:SoundTransform=new SoundTransform(1, 0);
		
		
		public function meSpeakFallback()
		{
			initExtIF();
		}
		
		private function initExtIF():void {
			var available:Boolean=false;
			try {
				if (ExternalInterface.available) {
					ExternalInterface.addCallback("play", play);
					ExternalInterface.addCallback("setVolume", setVolume);
					ExternalInterface.call("meSpeakFallbackHandshake");
					available=true;
				}
			}
			catch (e:Error) {}
			if (!available) setTimeout(initExtIF, 100);
		}
		
		public function setVolume(v:Number=0):void {
			if (v>=0 && v<=1) sndTransform.volume=v;
		}
		
		public function play(data:Array=null):void {
			if (!data) return;
			var l:uint=data.length;
			if (!l) return;
			// copy data to a ByteArray (oops: time, memory!)
			var ba:ByteArray=new ByteArray();
			ba.length=l;
			for (var i:uint=0; i<l; i++) ba.writeByte(data[i]);
			// play sound with global volume
			var snd:WavSound = new WavSound(ba);
			var chnl:WavSoundChannel=snd.play(0, 0, sndTransform);
		}
		
	}
}
